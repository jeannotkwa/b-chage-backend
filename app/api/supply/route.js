import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// Get supplies with filters
export async function GET(request) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const cashRegisterId = searchParams.get("cashRegisterId")
    const source = searchParams.get("source")
    const currencyCode = searchParams.get("currencyCode")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Get connection from pool
    const connection = await pool.getConnection()

    try {
      // Build query
      let query = "SELECT * FROM supplies WHERE 1=1"
      const params = []

      if (cashRegisterId) {
        query += " AND cash_register_id = ?"
        params.push(cashRegisterId)
      }

      if (source) {
        query += " AND source = ?"
        params.push(source)
      }

      if (currencyCode) {
        query += " AND currency_code = ?"
        params.push(currencyCode)
      }

      if (startDate && endDate) {
        query += " AND timestamp BETWEEN ? AND ?"
        params.push(startDate, endDate)
      } else if (startDate) {
        query += " AND timestamp >= ?"
        params.push(startDate)
      } else if (endDate) {
        query += " AND timestamp <= ?"
        params.push(endDate)
      }

      query += " ORDER BY timestamp DESC"

      // Get supplies
      const [supplies] = await connection.query(query, params)

      return NextResponse.json({ supplies })
    } finally {
      // Release connection back to pool
      connection.release()
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des approvisionnements:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Create new supply
export async function POST(request) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { cashRegisterId, currencyCode, amount, source, reference, notes, attachmentUrl } = await request.json()

    // Validate input
    if (!cashRegisterId || !currencyCode || amount === undefined || !source) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être renseignés" }, { status: 400 })
    }

    // Validate source
    if (!["internal", "external"].includes(source)) {
      return NextResponse.json({ error: "Source d'approvisionnement invalide" }, { status: 400 })
    }

    // Get connection from pool
    const connection = await pool.getConnection()

    try {
      // Start transaction
      await connection.beginTransaction()

      // Get cash register
      const [cashRegisters] = await connection.query("SELECT * FROM cash_registers WHERE id = ?", [cashRegisterId])

      if (cashRegisters.length === 0) {
        await connection.rollback()
        return NextResponse.json({ error: "Caisse non trouvée" }, { status: 404 })
      }

      const cashRegister = cashRegisters[0]

      // Check if cash register is open
      if (cashRegister.status !== "open") {
        await connection.rollback()
        return NextResponse.json({ error: "La caisse est fermée" }, { status: 400 })
      }

      // Check if user is the owner of the cash register
      if (cashRegister.cashier_id !== authResult.user.id) {
        await connection.rollback()
        return NextResponse.json({ error: "Vous n'êtes pas autorisé à approvisionner cette caisse" }, { status: 403 })
      }

      // Get currency
      const [currencies] = await connection.query("SELECT * FROM currencies WHERE code = ?", [currencyCode])

      if (currencies.length === 0) {
        await connection.rollback()
        return NextResponse.json({ error: "Devise non trouvée" }, { status: 404 })
      }

      const currency = currencies[0]

      // Check if currency is active
      if (!currency.is_active) {
        await connection.rollback()
        return NextResponse.json({ error: "Cette devise n'est pas active" }, { status: 400 })
      }

      // Generate supply number
      const supplyNumber = await generateSupplyNumber(connection)

      // Create supply
      const [result] = await connection.query(
        `INSERT INTO supplies 
        (cash_register_id, cashier_id, cashier_name, currency_code, currency_name, 
         amount, source, reference, notes, attachment_url, timestamp, supply_number) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [
          cashRegisterId,
          authResult.user.id,
          authResult.user.username,
          currencyCode,
          currency.name,
          amount,
          source,
          reference || null,
          notes || null,
          attachmentUrl || null,
          supplyNumber,
        ],
      )

      const supplyId = result.insertId

      // Update cash register balances
      // Get current balances
      const [currentBalances] = await connection.query(
        "SELECT * FROM cash_register_balances WHERE cash_register_id = ? AND balance_type = 'current' AND currency_code = ?",
        [cashRegisterId, currencyCode],
      )

      if (currentBalances.length > 0) {
        // Update existing balance
        await connection.query("UPDATE cash_register_balances SET amount = amount + ? WHERE id = ?", [
          amount,
          currentBalances[0].id,
        ])
      } else {
        // Insert new balance
        await connection.query(
          `INSERT INTO cash_register_balances 
          (cash_register_id, currency_code, amount, balance_type) 
          VALUES (?, ?, ?, 'current')`,
          [cashRegisterId, currencyCode, amount],
        )
      }

      // Add supply to cash register supplies
      await connection.query("INSERT INTO cash_register_supplies (cash_register_id, supply_id) VALUES (?, ?)", [
        cashRegisterId,
        supplyId,
      ])

      // Commit transaction
      await connection.commit()

      return NextResponse.json(
        {
          message: "Approvisionnement enregistré avec succès",
          supply: {
            id: supplyId,
            cashRegisterId,
            cashierId: authResult.user.id,
            cashierName: authResult.user.username,
            currencyCode,
            currencyName: currency.name,
            amount,
            source,
            reference: reference || null,
            notes: notes || null,
            attachmentUrl: attachmentUrl || null,
            timestamp: new Date(),
            supplyNumber,
          },
        },
        { status: 201 },
      )
    } catch (error) {
      // Rollback transaction in case of error
      await connection.rollback()
      throw error
    } finally {
      // Release connection back to pool
      connection.release()
    }
  } catch (error) {
    console.error("Erreur lors de la création d'un approvisionnement:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Helper function to generate supply number
async function generateSupplyNumber(connection) {
  const [result] = await connection.query(
    "INSERT INTO counters (counter_name, last_value) VALUES ('supply_number', 1) ON DUPLICATE KEY UPDATE last_value = last_value + 1",
  )

  const [counters] = await connection.query("SELECT last_value FROM counters WHERE counter_name = 'supply_number'")

  const sequenceValue = counters[0].last_value
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")

  return `S${year}${month}${day}-${sequenceValue.toString().padStart(4, "0")}`
}

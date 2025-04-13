import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { generateReceiptPDF } from "@/lib/pdf"

// Get transactions with filters
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
    const type = searchParams.get("type")
    const currencyCode = searchParams.get("currencyCode")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const cashierId = searchParams.get("cashierId")
    const clientId = searchParams.get("clientId")

    // Get connection from pool
    const connection = await pool.getConnection()

    try {
      // Build query
      let query = "SELECT * FROM transactions WHERE 1=1"
      const params = []

      if (cashRegisterId) {
        query += " AND cash_register_id = ?"
        params.push(cashRegisterId)
      }

      if (type) {
        query += " AND type = ?"
        params.push(type)
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

      if (cashierId) {
        query += " AND cashier_id = ?"
        params.push(cashierId)
      }

      if (clientId) {
        query += " AND client_id = ?"
        params.push(clientId)
      }

      query += " ORDER BY timestamp DESC"

      // Get transactions
      const [transactions] = await connection.query(query, params)

      return NextResponse.json({ transactions })
    } finally {
      // Release connection back to pool
      connection.release()
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des transactions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Create new transaction
export async function POST(request) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { type, cashRegisterId, currencyCode, amount, rate, localAmount, clientInfo, notes } = await request.json()

    // Validate input
    if (
      !type ||
      !cashRegisterId ||
      !currencyCode ||
      amount === undefined ||
      rate === undefined ||
      localAmount === undefined
    ) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être renseignés" }, { status: 400 })
    }

    // Validate transaction type
    if (!["buy", "sell"].includes(type)) {
      return NextResponse.json({ error: "Type de transaction invalide" }, { status: 400 })
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
        return NextResponse.json(
          { error: "Vous n'êtes pas autorisé à effectuer des transactions sur cette caisse" },
          { status: 403 },
        )
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

      // Generate receipt number
      const receiptNumber = await generateReceiptNumber(connection)

      // Create transaction
      const [result] = await connection.query(
        `INSERT INTO transactions 
        (type, cash_register_id, cashier_id, cashier_name, currency_code, currency_name, 
         amount, rate, local_amount, client_info, notes, timestamp, receipt_number) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [
          type,
          cashRegisterId,
          authResult.user.id,
          authResult.user.fullName,
          currencyCode,
          currency.name,
          amount,
          rate,
          localAmount,
          clientInfo ? JSON.stringify(clientInfo) : null,
          notes,
          receiptNumber,
        ],
      )

      const transactionId = result.insertId

      // Update cash register balances
      // Get current balances
      const [currentBalances] = await connection.query(
        "SELECT * FROM cash_register_balances WHERE cash_register_id = ? AND balance_type = 'current'",
        [cashRegisterId],
      )

      const localCurrencyBalance = currentBalances.find((b) => b.currency_code === "XOF") // Assuming XOF is the local currency
      const foreignCurrencyBalance = currentBalances.find((b) => b.currency_code === currencyCode)

      if (type === "buy") {
        // Buying foreign currency from client
        // Increase foreign currency, decrease local currency
        if (foreignCurrencyBalance) {
          // Update existing balance
          await connection.query("UPDATE cash_register_balances SET amount = amount + ? WHERE id = ?", [
            amount,
            foreignCurrencyBalance.id,
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

        if (localCurrencyBalance) {
          // Update existing balance
          await connection.query("UPDATE cash_register_balances SET amount = amount - ? WHERE id = ?", [
            localAmount,
            localCurrencyBalance.id,
          ])
        } else {
          // Insert new balance
          await connection.query(
            `INSERT INTO cash_register_balances 
            (cash_register_id, currency_code, amount, balance_type) 
            VALUES (?, ?, ?, 'current')`,
            [cashRegisterId, "XOF", -localAmount],
          )
        }
      } else {
        // Selling foreign currency to client
        // Decrease foreign currency, increase local currency
        if (foreignCurrencyBalance) {
          // Update existing balance
          await connection.query("UPDATE cash_register_balances SET amount = amount - ? WHERE id = ?", [
            amount,
            foreignCurrencyBalance.id,
          ])
        } else {
          // Insert new balance
          await connection.query(
            `INSERT INTO cash_register_balances 
            (cash_register_id, currency_code, amount, balance_type) 
            VALUES (?, ?, ?, 'current')`,
            [cashRegisterId, currencyCode, -amount],
          )
        }

        if (localCurrencyBalance) {
          // Update existing balance
          await connection.query("UPDATE cash_register_balances SET amount = amount + ? WHERE id = ?", [
            localAmount,
            localCurrencyBalance.id,
          ])
        } else {
          // Insert new balance
          await connection.query(
            `INSERT INTO cash_register_balances 
            (cash_register_id, currency_code, amount, balance_type) 
            VALUES (?, ?, ?, 'current')`,
            [cashRegisterId, "XOF", localAmount],
          )
        }
      }

      // Add transaction to cash register transactions
      await connection.query(
        "INSERT INTO cash_register_transactions (cash_register_id, transaction_id) VALUES (?, ?)",
        [cashRegisterId, transactionId],
      )

      // Commit transaction
      await connection.commit()

      // Generate receipt PDF
      const transaction = {
        id: transactionId,
        type,
        cashRegisterId,
        cashierId: authResult.user.id,
        cashierName: authResult.user.fullName,
        currencyCode,
        currencyName: currency.name,
        amount,
        rate,
        localAmount,
        clientInfo: clientInfo ? JSON.stringify(clientInfo) : null,
        notes,
        timestamp: new Date(),
        receiptNumber,
      }

      const receiptPdf = await generateReceiptPDF(transaction)

      return NextResponse.json(
        {
          message: "Transaction enregistrée avec succès",
          transaction,
          receiptUrl: receiptPdf,
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
    console.error("Erreur lors de la création d'une transaction:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Helper function to generate receipt number
async function generateReceiptNumber(connection) {
  const [result] = await connection.query(
    "INSERT INTO counters (counter_name, last_value) VALUES ('receipt_number', 1) ON DUPLICATE KEY UPDATE last_value = last_value + 1",
  )

  const [counters] = await connection.query("SELECT last_value FROM counters WHERE counter_name = 'receipt_number'")

  const sequenceValue = counters[0].last_value
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")

  return `R${year}${month}${day}-${sequenceValue.toString().padStart(4, "0")}`
}

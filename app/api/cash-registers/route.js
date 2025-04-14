import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// Get all cash registers or specific one
export async function GET(request) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const status = searchParams.get("status")

    // Get connection from pool
    const connection = await pool.getConnection()

    try {
      // Build query
      let query = "SELECT * FROM cash_registers WHERE 1=1"
      const params = []

      if (id) {
        query += " AND id = ?"
        params.push(id)
      }

      if (status) {
        query += " AND status = ?"
        params.push(status)
      }

      // Get cash registers
      const [cashRegisters] = await connection.query(query, params)

      // For each cash register, get its balances
      for (const register of cashRegisters) {
        const [balances] = await connection.query("SELECT * FROM cash_register_balances WHERE cash_register_id = ?", [
          register.id,
        ])
        register.initialBalances = balances.filter((b) => b.balance_type === "initial")
        register.currentBalances = balances.filter((b) => b.balance_type === "current")
      }

      return NextResponse.json({ cashRegisters })
    } finally {
      // Release connection back to pool
      connection.release()
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des caisses:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Open a cash register
export async function POST(request) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    console.log('authc:',authResult);
    
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { initialBalances } = await request.json()

    // Validate input
    if (!initialBalances || !Array.isArray(initialBalances) || initialBalances.length === 0) {
      return NextResponse.json({ error: "Les soldes initiaux sont requis" }, { status: 400 })
    }

    // Get connection from pool
    const connection = await pool.getConnection()

    try {
      // Start transaction
      await connection.beginTransaction()

      // Check if user already has an open cash register
      const [existingOpenRegisters] = await connection.query(
        "SELECT id FROM cash_registers WHERE cashier_id = ? AND status = 'open'",
        [authResult.user.id],
      )

      if (existingOpenRegisters.length > 0) {
        await connection.rollback()
        return NextResponse.json({ error: "Vous avez déjà une caisse ouverte" }, { status: 400 })
      }

      // Create new cash register
      const [result] = await connection.query(
        "INSERT INTO cash_registers (cashier_id, cashier_name, opened_at, status) VALUES (?, ?, NOW(), 'open')",
        [authResult.user.id, authResult.user.username],
      )

      const cashRegisterId = result.insertId

      // Insert initial balances
      for (const balance of initialBalances) {
        await connection.query(
          `INSERT INTO cash_register_balances 
          (cash_register_id, currency_code, amount, balance_type) 
          VALUES (?, ?, ?, 'initial')`,
          [cashRegisterId, balance.currencyCode, balance.amount],
        )

        // Also insert as current balance
        await connection.query(
          `INSERT INTO cash_register_balances 
          (cash_register_id, currency_code, amount, balance_type) 
          VALUES (?, ?, ?, 'current')`,
          [cashRegisterId, balance.currencyCode, balance.amount],
        )
      }

      // Create history record
      await connection.query(
        `INSERT INTO cash_register_history 
        (cash_register_id, cashier_id, action, timestamp, data) 
        VALUES (?, ?, 'open', NOW(), ?)`,
        [cashRegisterId, authResult.user.id, JSON.stringify({ initialBalances })],
      )

      // Commit transaction
      await connection.commit()

      return NextResponse.json(
        {
          message: "Caisse ouverte avec succès",
          cashRegister: {
            id: cashRegisterId,
            cashierId: authResult.user.id,
            cashierName: authResult.user.username,
            status: "open",
            initialBalances,
            currentBalances: [...initialBalances],
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
    console.error("Erreur lors de l'ouverture de la caisse:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

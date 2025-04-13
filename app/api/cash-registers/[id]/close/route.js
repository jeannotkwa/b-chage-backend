import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function POST(request, { params }) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { finalBalances, notes } = await request.json()

    // Validate input
    if (!finalBalances || !Array.isArray(finalBalances) || finalBalances.length === 0) {
      return NextResponse.json({ error: "Les soldes finaux sont requis" }, { status: 400 })
    }

    // Get connection from pool
    const connection = await pool.getConnection()

    try {
      // Start transaction
      await connection.beginTransaction()

      // Get cash register
      const [cashRegisters] = await connection.query("SELECT * FROM cash_registers WHERE id = ?", [params.id])

      if (cashRegisters.length === 0) {
        await connection.rollback()
        return NextResponse.json({ error: "Caisse non trouvée" }, { status: 404 })
      }

      const cashRegister = cashRegisters[0]

      // Check if cash register is already closed
      if (cashRegister.status === "closed") {
        await connection.rollback()
        return NextResponse.json({ error: "Cette caisse est déjà fermée" }, { status: 400 })
      }

      // Check if user is the owner of the cash register or an admin/supervisor
      if (cashRegister.cashier_id !== authResult.user.id && !["admin", "supervisor"].includes(authResult.user.role)) {
        await connection.rollback()
        return NextResponse.json({ error: "Vous n'êtes pas autorisé à fermer cette caisse" }, { status: 403 })
      }

      // Get current balances
      const [currentBalances] = await connection.query(
        "SELECT * FROM cash_register_balances WHERE cash_register_id = ? AND balance_type = 'current'",
        [params.id],
      )

      // Calculate differences
      const differences = finalBalances.map((finalBalance) => {
        const currentBalance = currentBalances.find((b) => b.currency_code === finalBalance.currencyCode)

        return {
          currencyCode: finalBalance.currencyCode,
          expected: currentBalance ? currentBalance.amount : 0,
          actual: finalBalance.amount,
          difference: finalBalance.amount - (currentBalance ? currentBalance.amount : 0),
        }
      })

      // Update cash register
      await connection.query(
        `UPDATE cash_registers 
        SET status = 'closed', closed_at = NOW(), closed_by = ?, notes = ? 
        WHERE id = ?`,
        [authResult.user.id, notes || null, params.id],
      )

      // Insert final balances
      for (const balance of finalBalances) {
        await connection.query(
          `INSERT INTO cash_register_balances 
          (cash_register_id, currency_code, amount, balance_type) 
          VALUES (?, ?, ?, 'final')`,
          [params.id, balance.currencyCode, balance.amount],
        )
      }

      // Create history record
      await connection.query(
        `INSERT INTO cash_register_history 
        (cash_register_id, cashier_id, action, timestamp, performed_by, data) 
        VALUES (?, ?, 'close', NOW(), ?, ?)`,
        [params.id, cashRegister.cashier_id, authResult.user.id, JSON.stringify({ finalBalances, differences, notes })],
      )

      // Commit transaction
      await connection.commit()

      return NextResponse.json({
        message: "Caisse fermée avec succès",
        differences,
      })
    } catch (error) {
      // Rollback transaction in case of error
      await connection.rollback()
      throw error
    } finally {
      // Release connection back to pool
      connection.release()
    }
  } catch (error) {
    console.error("Erreur lors de la fermeture de la caisse:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

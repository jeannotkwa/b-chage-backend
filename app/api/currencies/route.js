import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { verifyToken, isAdminOrSupervisor } from "@/lib/auth"

// Get all currencies
export async function GET(request) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Get connection from pool
    const connection = await pool.getConnection()

    try {
      // Get all currencies
      const [currencies] = await connection.query("SELECT * FROM currencies")

      return NextResponse.json({ currencies })
    } finally {
      // Release connection back to pool
      connection.release()
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des devises:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Add new currency (admin or supervisor only)
export async function POST(request) {
  try {
    // Verify authentication and authorization
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Check if user is admin or supervisor
    if (!isAdminOrSupervisor(authResult.user)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { code, name, symbol, buyRate, sellRate, isActive } = await request.json()

    // Validate input
    if (!code || !name || buyRate === undefined || sellRate === undefined) {
      return NextResponse.json(
        { error: "Les champs code, nom, taux d'achat et taux de vente sont requis" },
        { status: 400 },
      )
    }

    // Get connection from pool
    const connection = await pool.getConnection()

    try {
      // Check if currency already exists
      const [existingCurrencies] = await connection.query("SELECT id FROM currencies WHERE code = ?", [code])

      if (existingCurrencies.length > 0) {
        return NextResponse.json({ error: "Cette devise existe déjà" }, { status: 400 })
      }

      // Create new currency
      const [result] = await connection.query(
        `INSERT INTO currencies 
        (code, name, symbol, buy_rate, sell_rate, is_active, created_at, created_by, updated_at, updated_by) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?)`,
        [
          code,
          name,
          symbol || code,
          buyRate,
          sellRate,
          isActive !== undefined ? isActive : true,
          authResult.user.id,
          authResult.user.id,
        ],
      )

      return NextResponse.json(
        {
          message: "Devise ajoutée avec succès",
          currency: {
            id: result.insertId,
            code,
            name,
            symbol: symbol || code,
            buyRate,
            sellRate,
            isActive: isActive !== undefined ? isActive : true,
          },
        },
        { status: 201 },
      )
    } finally {
      // Release connection back to pool
      connection.release()
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout d'une devise:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

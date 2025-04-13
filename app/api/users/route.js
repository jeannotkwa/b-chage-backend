import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { pool } from "@/lib/db"
import { verifyToken, isAdmin } from "@/lib/auth"

// Get all users (admin only)
export async function GET(request) {
  try {
    // Verify authentication and authorization
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Check if user is admin
    if (!isAdmin(authResult.user)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Get connection from pool
    const connection = await pool.getConnection()

    try {
      // Get all users (excluding password)
      const [users] = await connection.query("SELECT id, username, full_name, role, created_at FROM users")

      return NextResponse.json({ users })
    } finally {
      // Release connection back to pool
      connection.release()
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Create new user (admin only)
export async function POST(request) {
  try {
    // Verify authentication and authorization
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Check if user is admin
    if (!isAdmin(authResult.user)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { username, password, fullName, role } = await request.json()

    // Validate input
    if (!username || !password || !fullName || !role) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 })
    }

    // Get connection from pool
    const connection = await pool.getConnection()

    try {
      // Check if username already exists
      const [existingUsers] = await connection.query("SELECT id FROM users WHERE username = ?", [username])

      if (existingUsers.length > 0) {
        return NextResponse.json({ error: "Nom d'utilisateur déjà utilisé" }, { status: 400 })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create new user
      const [result] = await connection.query(
        "INSERT INTO users (username, password, full_name, role, created_at, created_by) VALUES (?, ?, ?, ?, NOW(), ?)",
        [username, hashedPassword, fullName, role, authResult.user.id],
      )

      return NextResponse.json(
        {
          message: "Utilisateur créé avec succès",
          user: {
            id: result.insertId,
            username,
            fullName,
            role,
          },
        },
        { status: 201 },
      )
    } finally {
      // Release connection back to pool
      connection.release()
    }
  } catch (error) {
    console.error("Erreur lors de la création d'un utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

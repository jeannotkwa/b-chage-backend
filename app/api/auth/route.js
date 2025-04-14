import { NextResponse, userAgent } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { pool } from "@/lib/db"
import { cors } from "@/lib/cors"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request) {
  // Handle CORS
  const response = NextResponse.next()
  await cors(request, response)

  try {
    const { username, password } = await request.json()

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Nom d'utilisateur et mot de passe requis" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        },
      )
    }

    // Get connection from pool
    const connection = await pool.getConnection()

    try {
      // Find user
      const [users] = await connection.query("SELECT * FROM users WHERE username = ?", [username])
      console.log('user', users);
      console.log('len',users.length);
      
      if (users.length === 0) {
        return NextResponse.json(
          { error: "Identifiants invalides" },
          {
            status: 401,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          },
        )
      }

      const user = users[0]

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Identifiants invalides ou mot de passe incorect" },
          {
            status: 401,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          },
        )
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "8h" },
      )

      return NextResponse.json(
        {
          message: "Authentification réussie",
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            fullName: user.full_name,
          },
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        },
      )
    } finally {
      // Release connection back to pool
      connection.release()
    }
  } catch (error) {
    console.error("Erreur d'authentification:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'authentification" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    )
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}

import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Verify JWT token from request headers
export async function verifyToken(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        success: false,
        error: "Token d'authentification requis",
        status: 401,
      }
    }

    // Extract token
    const token = authHeader.split(" ")[1]

    if (!token) {
      return {
        success: false,
        error: "Token d'authentification invalide",
        status: 401,
      }
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET)

    return {
      success: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
      },
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return {
        success: false,
        error: "Token expiré",
        status: 401,
      }
    }

    return {
      success: false,
      error: "Token invalide",
      status: 401,
    }
  }
}

// Check if user is admin
export function isAdmin(user) {
  return user.role === "admin"
}

// Check if user is admin or supervisor
export function isAdminOrSupervisor(user) {
  return ["admin", "supervisor"].includes(user.role)
}

// Check if user is cashier
export function isCashier(user) {
  return user.role === "cashier"
}

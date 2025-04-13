// Helper function to handle CORS
export function cors(req, res) {
  return new Promise((resolve, reject) => {
    // Set CORS headers
    res.headers.set("Access-Control-Allow-Origin", "*") // You can replace * with your frontend URL for production
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return resolve(new Response(null, { status: 204, headers: res.headers }))
    }

    resolve()
  })
}

import { NextResponse } from "next/server"

export function middleware(request) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Only run this middleware for API routes
  if (path.startsWith("/api/")) {
    // Clone the request headers
    const requestHeaders = new Headers(request.headers)

    // Get response
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Add CORS headers to the response
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}

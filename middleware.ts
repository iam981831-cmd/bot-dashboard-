import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "fallback-secret-please-change-this"
  return new TextEncoder().encode(secret)
}

const PROTECTED_PATHS = ["/dashboard", "/bots", "/settings"]
const AUTH_PATHS = ["/login"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("auth_token")?.value

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p))
  const isRootPath = pathname === "/"

  // Verify token helper
  async function isValidToken(): Promise<boolean> {
    if (!token) return false
    try {
      await jwtVerify(token, getSecret())
      return true
    } catch {
      return false
    }
  }

  if (isRootPath) {
    if (await isValidToken()) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isProtected) {
    if (!(await isValidToken())) {
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("auth_token")
      return response
    }
  }

  if (isAuthPath && (await isValidToken())) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

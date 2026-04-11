import { SignJWT, jwtVerify } from "jose"
import { NextRequest } from "next/server"

export const AUTH_COOKIE = "auth_token"

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "fallback-secret-please-change-this"
  return new TextEncoder().encode(secret)
}

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return { userId: payload.userId as string }
  } catch {
    return null
  }
}

export async function getAuthFromRequest(request: Request): Promise<{ userId: string } | null> {
  const token = (request as NextRequest).cookies.get(AUTH_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

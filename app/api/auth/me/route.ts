import { NextRequest, NextResponse } from "next/server"
import { getAuthFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.json({ userId: auth.userId })
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthFromRequest } from "@/lib/auth"

export async function DELETE(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const result = await prisma.pingLog.deleteMany()
    return NextResponse.json({ deleted: result.count, success: true })
  } catch {
    return NextResponse.json({ error: "Failed to clear ping history" }, { status: 500 })
  }
}

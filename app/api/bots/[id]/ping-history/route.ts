import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthFromRequest } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const logs = await prisma.pingLog.findMany({
      where: { botId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json(
      logs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      }))
    )
  } catch {
    return NextResponse.json({ error: "Failed to fetch ping history" }, { status: 500 })
  }
}

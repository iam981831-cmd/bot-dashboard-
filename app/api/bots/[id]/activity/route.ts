import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthFromRequest } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const logs = await prisma.activityLog.findMany({
      where: { botId: params.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json(
      logs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      }))
    )
  } catch {
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { message, type } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const bot = await prisma.bot.findUnique({ where: { id: params.id } })
    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 })

    const log = await prisma.activityLog.create({
      data: {
        botId: params.id,
        message: message.trim(),
        type: type || "info",
      },
    })

    return NextResponse.json(
      { ...log, createdAt: log.createdAt.toISOString() },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: "Failed to create activity log" }, { status: 500 })
  }
}

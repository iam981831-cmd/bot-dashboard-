import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bot_id, tokens } = body
    if (!bot_id || typeof tokens !== "number") {
      return NextResponse.json({ error: "Missing bot_id or tokens" }, { status: 400 })
    }
    const log = await prisma.usageLog.create({ data: { botId: bot_id, tokens } })
    return NextResponse.json(log, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to save usage" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const now = new Date()
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
    const monthStart = new Date(now); monthStart.setDate(now.getDate() - 30)

    const [todayAgg, monthAgg, dailyRows] = await Promise.all([
      prisma.usageLog.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { tokens: true },
      }),
      prisma.usageLog.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { tokens: true },
      }),
      prisma.usageLog.findMany({
        where: { createdAt: { gte: monthStart } },
        select: { tokens: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ])

    // Group by day YYYY-MM-DD
    const dailyMap: Record<string, number> = {}
    for (const row of dailyRows) {
      const day = row.createdAt.toISOString().slice(0, 10)
      dailyMap[day] = (dailyMap[day] ?? 0) + row.tokens
    }

    const monthTokens = monthAgg._sum.tokens ?? 0
    // GLM-4.5-air ~$0.0001 per 1K tokens, EUR rate ~0.92
    const costEUR = ((monthTokens / 1000) * 0.0001 * 0.92).toFixed(4)

    return NextResponse.json({
      today: todayAgg._sum.tokens ?? 0,
      month: monthTokens,
      costEUR,
      daily: dailyMap,
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 })
  }
}

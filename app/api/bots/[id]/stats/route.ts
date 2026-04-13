import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthFromRequest } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0)
  const weekStart  = new Date(now); weekStart.setDate(now.getDate() - 7)
  const monthStart = new Date(now); monthStart.setDate(now.getDate() - 30)

  try {
    const [today, week, month, total] = await Promise.all([
      prisma.conversationStat.aggregate({
        where: { botId: params.id, createdAt: { gte: todayStart } },
        _sum: { conversations: true, appointments: true, unanswered: true },
      }),
      prisma.conversationStat.aggregate({
        where: { botId: params.id, createdAt: { gte: weekStart } },
        _sum: { conversations: true, appointments: true, unanswered: true },
      }),
      prisma.conversationStat.aggregate({
        where: { botId: params.id, createdAt: { gte: monthStart } },
        _sum: { conversations: true, appointments: true, unanswered: true },
      }),
      prisma.conversationStat.aggregate({
        where: { botId: params.id },
        _sum: { conversations: true, appointments: true, unanswered: true },
      }),
    ])

    return NextResponse.json({
      today: {
        conversations: today._sum.conversations ?? 0,
        appointments:  today._sum.appointments  ?? 0,
        unanswered:    today._sum.unanswered    ?? 0,
      },
      week: {
        conversations: week._sum.conversations ?? 0,
        appointments:  week._sum.appointments  ?? 0,
        unanswered:    week._sum.unanswered    ?? 0,
      },
      month: {
        conversations: month._sum.conversations ?? 0,
        appointments:  month._sum.appointments  ?? 0,
        unanswered:    month._sum.unanswered    ?? 0,
      },
      total: {
        conversations: total._sum.conversations ?? 0,
        appointments:  total._sum.appointments  ?? 0,
        unanswered:    total._sum.unanswered    ?? 0,
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}

// Called by sam_bot to push stats
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Accept either JWT auth or a shared API key
  const apiKey = request.headers.get("x-api-key")
  const validKey = process.env.STATS_API_KEY
  const auth = await getAuthFromRequest(request)
  if (!auth && (!validKey || apiKey !== validKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { conversations = 0, appointments = 0, unanswered = 0 } = body

    const stat = await prisma.conversationStat.create({
      data: {
        botId: params.id,
        conversations,
        appointments,
        unanswered,
      },
    })

    // Update bot lastSeenAt
    await prisma.bot.update({
      where: { id: params.id },
      data: { lastSeenAt: new Date(), status: "Active" },
    })

    return NextResponse.json(stat, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to record stats" }, { status: 500 })
  }
}

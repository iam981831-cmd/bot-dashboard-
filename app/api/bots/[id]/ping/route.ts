import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthFromRequest } from "@/lib/auth"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const bot = await prisma.bot.findUnique({ where: { id } })
    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 })

    if (!bot.baseUrl) {
      return NextResponse.json(
        { error: "No URL configured for this bot", success: false },
        { status: 422 }
      )
    }

    const startTime = Date.now()
    let responseTime: number | null = null
    let statusCode: number | null = null
    let success = false
    let errorMsg: string | null = null

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(bot.baseUrl, {
        method: "GET",
        signal: controller.signal,
        headers: { "User-Agent": "BotManager/1.0 Ping" },
      })

      clearTimeout(timeoutId)
      responseTime = Date.now() - startTime
      statusCode = res.status
      success = res.status >= 200 && res.status < 300
    } catch (err) {
      responseTime = Date.now() - startTime
      errorMsg =
        err instanceof Error
          ? err.name === "AbortError"
            ? "Request timed out after 10s"
            : err.message
          : "Unknown error"
    }

    await prisma.pingLog.create({
      data: { botId: id, responseTime, statusCode, success, error: errorMsg },
    })

    // Prune to last 20 logs
    const logs = await prisma.pingLog.findMany({
      where: { botId: id },
      orderBy: { createdAt: "desc" },
      skip: 20,
      select: { id: true },
    })
    if (logs.length > 0) {
      await prisma.pingLog.deleteMany({
        where: { id: { in: logs.map((l) => l.id) } },
      })
    }

    await prisma.bot.update({
      where: { id },
      data: {
        lastSeenAt: success ? new Date() : undefined,
        status: !success && bot.status === "Active" ? "Error" : undefined,
      },
    })

    return NextResponse.json({ success, responseTime, statusCode, error: errorMsg })
  } catch {
    return NextResponse.json({ error: "Ping failed" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const bots = await prisma.bot.findMany({
      orderBy: { createdAt: "asc" },
    })

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      bots: bots.map((bot) => ({
        name: bot.name,
        description: bot.description,
        type: bot.type,
        status: bot.status,
        baseUrl: bot.baseUrl,
        tags: (() => { try { return JSON.parse(bot.tags) } catch { return [] } })(),
        notes: bot.notes,
        pingInterval: bot.pingInterval,
        // Note: API keys are NOT exported for security
      })),
    }

    const json = JSON.stringify(exportData, null, 2)
    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="bot-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

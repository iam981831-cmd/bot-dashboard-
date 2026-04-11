import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthFromRequest } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()

    if (!body.bots || !Array.isArray(body.bots)) {
      return NextResponse.json(
        { error: "Invalid format. Expected { bots: [...] }" },
        { status: 400 }
      )
    }

    const VALID_TYPES = ["Telegram", "Discord", "WhatsApp", "Slack", "Custom API", "Other"]
    const VALID_STATUSES = ["Active", "Inactive", "Error", "Maintenance"]

    let imported = 0
    for (const bot of body.bots) {
      if (!bot.name?.trim()) continue

      await prisma.bot.create({
        data: {
          name: String(bot.name).trim(),
          description: bot.description ? String(bot.description).trim() : null,
          type: VALID_TYPES.includes(bot.type) ? bot.type : "Custom API",
          status: VALID_STATUSES.includes(bot.status) ? bot.status : "Inactive",
          baseUrl: bot.baseUrl ? String(bot.baseUrl).trim() : null,
          tags: JSON.stringify(Array.isArray(bot.tags) ? bot.tags : []),
          notes: bot.notes ? String(bot.notes).trim() : null,
          pingInterval: typeof bot.pingInterval === "number" ? bot.pingInterval : null,
        },
      })
      imported++
    }

    return NextResponse.json({ imported, success: true })
  } catch {
    return NextResponse.json({ error: "Import failed" }, { status: 500 })
  }
}

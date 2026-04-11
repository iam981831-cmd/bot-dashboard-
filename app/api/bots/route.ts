import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthFromRequest } from "@/lib/auth"
import { encrypt, maskApiKey } from "@/lib/encryption"

function formatBot(bot: {
  id: string
  name: string
  description: string | null
  type: string
  status: string
  baseUrl: string | null
  apiKeyEncrypted: string | null
  tags: string
  notes: string | null
  pingInterval: number | null
  createdAt: Date
  updatedAt: Date
  lastSeenAt: Date | null
}) {
  return {
    ...bot,
    tags: (() => {
      try { return JSON.parse(bot.tags) } catch { return [] }
    })(),
    apiKeyMasked: maskApiKey(bot.apiKeyEncrypted),
    apiKeyEncrypted: undefined,
    createdAt: bot.createdAt.toISOString(),
    updatedAt: bot.updatedAt.toISOString(),
    lastSeenAt: bot.lastSeenAt?.toISOString() ?? null,
  }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const bots = await prisma.bot.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(bots.map(formatBot))
  } catch {
    return NextResponse.json({ error: "Failed to fetch bots" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const { name, description, type, status, baseUrl, apiKey, tags, notes, pingInterval } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const bot = await prisma.bot.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        type: type || "Custom API",
        status: status || "Inactive",
        baseUrl: baseUrl?.trim() || null,
        apiKeyEncrypted: apiKey ? encrypt(apiKey) : null,
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
        notes: notes?.trim() || null,
        pingInterval: pingInterval || null,
      },
    })

    return NextResponse.json(formatBot(bot), { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create bot" }, { status: 500 })
  }
}

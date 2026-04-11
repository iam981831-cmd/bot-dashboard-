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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const bot = await prisma.bot.findUnique({ where: { id: params.id } })
    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    return NextResponse.json(formatBot(bot))
  } catch {
    return NextResponse.json({ error: "Failed to fetch bot" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const { name, description, type, status, baseUrl, apiKey, tags, notes, pingInterval } = body

    const existing = await prisma.bot.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: "Bot not found" }, { status: 404 })

    const bot = await prisma.bot.update({
      where: { id: params.id },
      data: {
        name: name?.trim() ?? existing.name,
        description: description?.trim() ?? existing.description,
        type: type ?? existing.type,
        status: status ?? existing.status,
        baseUrl: baseUrl?.trim() ?? existing.baseUrl,
        apiKeyEncrypted: apiKey ? encrypt(apiKey) : existing.apiKeyEncrypted,
        tags: tags !== undefined ? JSON.stringify(Array.isArray(tags) ? tags : []) : existing.tags,
        notes: notes?.trim() ?? existing.notes,
        pingInterval: pingInterval !== undefined ? pingInterval : existing.pingInterval,
      },
    })

    return NextResponse.json(formatBot(bot))
  } catch {
    return NextResponse.json({ error: "Failed to update bot" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const bot = await prisma.bot.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(formatBot(bot))
  } catch {
    return NextResponse.json({ error: "Failed to update bot" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    await prisma.bot.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete bot" }, { status: 500 })
  }
}

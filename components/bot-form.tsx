"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Bot } from "@/types"

const BOT_TYPES = ["Telegram", "Discord", "WhatsApp", "Slack", "Custom API", "Other"]
const BOT_STATUSES = ["Active", "Inactive", "Error", "Maintenance"]
const PING_INTERVALS = [
  { label: "No auto-ping", value: "none" },
  { label: "Every 5 minutes", value: "5" },
  { label: "Every 15 minutes", value: "15" },
  { label: "Every 30 minutes", value: "30" },
  { label: "Every 60 minutes", value: "60" },
]

interface BotFormProps {
  bot?: Bot
  mode: "create" | "edit"
}

export function BotForm({ bot, mode }: BotFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: bot?.name ?? "",
    description: bot?.description ?? "",
    type: bot?.type ?? "Custom API",
    status: bot?.status ?? "Inactive",
    baseUrl: bot?.baseUrl ?? "",
    apiKey: "",
    tags: bot?.tags?.join(", ") ?? "",
    notes: bot?.notes ?? "",
    pingInterval: bot?.pingInterval?.toString() ?? "none",
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error("Bot name is required")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        type: form.type,
        status: form.status,
        baseUrl: form.baseUrl.trim() || null,
        apiKey: form.apiKey || undefined,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes: form.notes.trim() || null,
        pingInterval: form.pingInterval && form.pingInterval !== "none" ? parseInt(form.pingInterval) : null,
      }

      const url = mode === "create" ? "/api/bots" : `/api/bots/${bot!.id}`
      const method = mode === "create" ? "POST" : "PUT"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save")
      }

      const saved = await res.json()
      toast.success(mode === "create" ? "Bot created!" : "Bot updated!")
      router.push(`/bots/${saved.id}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="My Awesome Bot"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => handleChange("type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="What does this bot do?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => handleChange("status", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL / Webhook URL</Label>
            <Input
              id="baseUrl"
              value={form.baseUrl}
              onChange={(e) => handleChange("baseUrl", e.target.value)}
              placeholder="https://api.example.com/bot/health"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">
              API Key / Token
              {mode === "edit" && bot?.apiKeyMasked && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  Current: {bot.apiKeyMasked} — leave blank to keep unchanged
                </span>
              )}
            </Label>
            <Input
              id="apiKey"
              value={form.apiKey}
              onChange={(e) => handleChange("apiKey", e.target.value)}
              placeholder={
                mode === "edit" && bot?.apiKeyMasked
                  ? "Enter new key to replace…"
                  : "Enter API key or token…"
              }
              type="password"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pingInterval">Auto-Ping Interval</Label>
            <Select
              value={form.pingInterval}
              onValueChange={(v) => handleChange("pingInterval", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No auto-ping" />
              </SelectTrigger>
              <SelectContent>
                {PING_INTERVALS.map((i) => (
                  <SelectItem key={i.value} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tags">
              Tags{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (comma-separated)
              </span>
            </Label>
            <Input
              id="tags"
              value={form.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
              placeholder="production, alerts, team-a"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional notes about this bot…"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Create Bot" : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

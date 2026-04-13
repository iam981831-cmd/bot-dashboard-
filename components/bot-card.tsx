"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  MoreVertical, Eye, Edit, Trash2, ToggleLeft, ToggleRight,
  Wifi, Clock, MessageCircle, CalendarCheck, HelpCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { QuickEditDialog } from "@/components/quick-edit-dialog"
import { timeAgo } from "@/lib/utils"
import type { Bot, BotConversationStats } from "@/types"

interface BotCardProps {
  bot: Bot
  onRefresh: () => void
}

function getStatusVariant(status: string): "success" | "error" | "warning" | "maintenance" | "outline" {
  switch (status) {
    case "Active":      return "success"
    case "Error":       return "error"
    case "Inactive":    return "warning"
    case "Maintenance": return "maintenance"
    default:            return "outline"
  }
}

function getBotTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    Telegram: "✈️", Discord: "🎮", WhatsApp: "💬",
    Slack: "💼", "Custom API": "🔧", Other: "🤖",
  }
  return icons[type] || "🤖"
}

function isActiveRecently(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false
  return Date.now() - new Date(lastSeenAt).getTime() < 24 * 60 * 60 * 1000
}

export function BotCard({ bot, onRefresh }: BotCardProps) {
  const router = useRouter()
  const [pinging, setPinging]       = useState(false)
  const [pingResult, setPingResult] = useState<{ success: boolean; ms?: number } | null>(null)
  const [toggling, setToggling]     = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [showEdit, setShowEdit]     = useState(false)
  const [convStats, setConvStats]   = useState<BotConversationStats | null>(null)

  useEffect(() => {
    fetch(`/api/bots/${bot.id}/stats`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setConvStats(d))
      .catch(() => {})
  }, [bot.id])

  const handlePing = async () => {
    setPinging(true)
    setPingResult(null)
    try {
      const res  = await fetch(`/api/bots/${bot.id}/ping`, { method: "POST" })
      const data = await res.json()
      setPingResult({ success: data.success, ms: data.responseTime })
      data.success
        ? toast.success(`Ping successful — ${data.responseTime}ms`)
        : toast.error(`Ping failed — ${data.error || "No response"}`)
      onRefresh()
    } catch {
      setPingResult({ success: false })
      toast.error("Ping request failed")
    } finally {
      setPinging(false)
    }
  }

  const handleToggle = async () => {
    setToggling(true)
    const newStatus = bot.status === "Active" ? "Inactive" : "Active"
    try {
      const res = await fetch(`/api/bots/${bot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Bot ${newStatus === "Active" ? "activated" : "deactivated"}`)
      onRefresh()
    } catch {
      toast.error("Failed to update status")
    } finally {
      setToggling(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/bots/${bot.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Bot deleted")
      onRefresh()
    } catch {
      toast.error("Failed to delete bot")
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  const active = isActiveRecently(bot.lastSeenAt)

  return (
    <>
      <Card className="hover:border-primary/50 transition-all hover:shadow-md group">
        <CardContent className="p-4 space-y-3">

          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 min-w-0">
              <div className="text-2xl mt-0.5 shrink-0">{getBotTypeIcon(bot.type)}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm truncate">{bot.name}</h3>
                  {/* Status dot */}
                  <span
                    className={`inline-flex h-2 w-2 rounded-full shrink-0 ${
                      active ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]" : "bg-red-400"
                    }`}
                    title={active ? "Active in last 24h" : "No activity in 24h+"}
                  />
                  <Badge variant={getStatusVariant(bot.status)} className="text-xs">
                    {bot.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{bot.type}</p>
                {bot.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {bot.description}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/bots/${bot.id}`)}>
                  <Eye className="h-4 w-4 mr-2" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEdit(true)}>
                  <Edit className="h-4 w-4 mr-2" /> تعديل سريع · Quick Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleToggle} disabled={toggling}>
                  {bot.status === "Active"
                    ? <><ToggleLeft  className="h-4 w-4 mr-2" /> Deactivate</>
                    : <><ToggleRight className="h-4 w-4 mr-2" /> Activate</>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => setShowDelete(true)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Conversation stats */}
          {convStats && (
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/60">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                  <MessageCircle className="h-3 w-3" />
                  <span className="text-[10px]">اليوم</span>
                </div>
                <p className="text-sm font-bold">{convStats.today.conversations}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                  <CalendarCheck className="h-3 w-3" />
                  <span className="text-[10px]">مواعيد</span>
                </div>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  {convStats.total.appointments}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                  <HelpCircle className="h-3 w-3" />
                  <span className="text-[10px]">بدون جواب</span>
                </div>
                <p className={`text-sm font-bold ${convStats.today.unanswered > 0 ? "text-orange-500" : ""}`}>
                  {convStats.today.unanswered}
                </p>
              </div>
            </div>
          )}

          {/* Weekly/monthly mini summary */}
          {convStats && (
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>الأسبوع: <strong className="text-foreground">{convStats.week.conversations}</strong></span>
              <span>الشهر: <strong className="text-foreground">{convStats.month.conversations}</strong></span>
            </div>
          )}

          {/* Tags */}
          {bot.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {bot.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
              {bot.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{bot.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{timeAgo(bot.lastSeenAt)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {pingResult && (
                <span className={`text-xs font-medium ${pingResult.success ? "text-green-500" : "text-red-500"}`}>
                  {pingResult.success ? `${pingResult.ms}ms` : "Failed"}
                </span>
              )}
              <Button
                variant="outline" size="sm"
                onClick={handlePing}
                disabled={pinging || !bot.baseUrl}
                className="h-7 text-xs"
              >
                <Wifi className={`h-3 w-3 mr-1 ${pinging ? "animate-pulse" : ""}`} />
                {pinging ? "…" : "Ping"}
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowEdit(true)}>
                <Edit className="h-3 w-3 mr-1" />
                تعديل
              </Button>
              <Link href={`/bots/${bot.id}`}>
                <Button variant="outline" size="sm" className="h-7 text-xs">View</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <QuickEditDialog
        bot={bot}
        open={showEdit}
        onOpenChange={setShowEdit}
        onSaved={onRefresh}
      />

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{bot.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the bot and all its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

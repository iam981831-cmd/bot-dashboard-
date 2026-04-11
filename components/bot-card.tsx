"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Wifi,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { timeAgo } from "@/lib/utils"
import type { Bot } from "@/types"

interface BotCardProps {
  bot: Bot
  onRefresh: () => void
}

function getStatusVariant(status: string): "success" | "error" | "warning" | "maintenance" | "outline" {
  switch (status) {
    case "Active": return "success"
    case "Error": return "error"
    case "Inactive": return "warning"
    case "Maintenance": return "maintenance"
    default: return "outline"
  }
}

function getBotTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    Telegram: "✈️",
    Discord: "🎮",
    WhatsApp: "💬",
    Slack: "💼",
    "Custom API": "🔧",
    Other: "🤖",
  }
  return icons[type] || "🤖"
}

export function BotCard({ bot, onRefresh }: BotCardProps) {
  const router = useRouter()
  const [pinging, setPinging] = useState(false)
  const [pingResult, setPingResult] = useState<{
    success: boolean
    ms?: number
    status?: number
  } | null>(null)
  const [toggling, setToggling] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handlePing = async () => {
    setPinging(true)
    setPingResult(null)
    try {
      const res = await fetch(`/api/bots/${bot.id}/ping`, { method: "POST" })
      const data = await res.json()
      setPingResult({
        success: data.success,
        ms: data.responseTime,
        status: data.statusCode,
      })
      if (data.success) {
        toast.success(`Ping successful — ${data.responseTime}ms`)
      } else {
        toast.error(`Ping failed — ${data.error || "No response"}`)
      }
      onRefresh()
    } catch {
      setPingResult({ success: false })
      toast.error("Ping request failed")
    } finally {
      setPinging(false)
    }
  }

  const handleToggleStatus = async () => {
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
      toast.success("Bot deleted successfully")
      onRefresh()
    } catch {
      toast.error("Failed to delete bot")
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  return (
    <>
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 min-w-0">
              <div className="text-2xl mt-0.5 shrink-0">
                {getBotTypeIcon(bot.type)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm truncate">{bot.name}</h3>
                  <Badge variant={getStatusVariant(bot.status)}>
                    {bot.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{bot.type}</p>
                {bot.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {bot.description}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/bots/${bot.id}`)}>
                  <Eye className="h-4 w-4 mr-2" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/bots/${bot.id}?edit=true`)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleToggleStatus} disabled={toggling}>
                  {bot.status === "Active" ? (
                    <><ToggleLeft className="h-4 w-4 mr-2" /> Deactivate</>
                  ) : (
                    <><ToggleRight className="h-4 w-4 mr-2" /> Activate</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tags */}
          {bot.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {bot.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {bot.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{bot.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{timeAgo(bot.lastSeenAt)}</span>
            </div>

            <div className="flex items-center gap-2">
              {pingResult && (
                <span
                  className={`text-xs font-medium ${
                    pingResult.success ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {pingResult.success
                    ? `${pingResult.ms}ms`
                    : "Failed"}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePing}
                disabled={pinging || !bot.baseUrl}
                className="h-7 text-xs"
              >
                <Wifi className={`h-3 w-3 mr-1 ${pinging ? "animate-pulse" : ""}`} />
                {pinging ? "Pinging…" : "Ping"}
              </Button>
              <Link href={`/bots/${bot.id}`}>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  View
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{bot.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the bot and all its ping history and
              activity logs. This action cannot be undone.
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

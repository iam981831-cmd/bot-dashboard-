"use client"

import { useState } from "react"
import { Plus, Info, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDate } from "@/lib/utils"
import type { ActivityLog as ActivityLogType } from "@/types"

const typeConfig = {
  info: { icon: Info, color: "text-blue-500" },
  warning: { icon: AlertTriangle, color: "text-yellow-500" },
  error: { icon: XCircle, color: "text-red-500" },
  success: { icon: CheckCircle2, color: "text-green-500" },
}

interface ActivityLogProps {
  botId: string
  logs: ActivityLogType[]
  onRefresh: () => void
}

export function ActivityLog({ botId, logs, onRefresh }: ActivityLogProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [type, setType] = useState("info")
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!message.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/bots/${botId}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), type }),
      })
      if (!res.ok) throw new Error()
      toast.success("Activity logged")
      setMessage("")
      setType("info")
      setOpen(false)
      onRefresh()
    } catch {
      toast.error("Failed to add activity")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Activity Log
        </h3>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Note
        </Button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No activity logged yet.
        </div>
      ) : (
        <ScrollArea className="h-64">
          <div className="space-y-2 pr-3">
            {logs.map((log) => {
              const cfg = typeConfig[log.type as keyof typeof typeConfig] || typeConfig.info
              const Icon = cfg.icon
              return (
                <div key={log.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                  <div className="min-w-0">
                    <p className="text-sm">{log.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Activity Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What happened?"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={saving || !message.trim()}>
              {saving ? "Adding…" : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

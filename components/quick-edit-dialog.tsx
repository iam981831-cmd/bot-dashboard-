"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Bot } from "@/types"

interface QuickEditDialogProps {
  bot: Bot
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function QuickEditDialog({ bot, open, onOpenChange, onSaved }: QuickEditDialogProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: bot.name,
    description: bot.description ?? "",
    notes: bot.notes ?? "",
  })

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Bot name is required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/bots/${bot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          notes: form.notes.trim() || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("تم الحفظ · Saved")
      onOpenChange(false)
      onSaved()
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">
            تعديل سريع · Quick Edit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>اسم البوت · Bot Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Bot name"
            />
          </div>

          <div className="space-y-1.5">
            <Label>الوصف · Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description"
            />
          </div>

          <div className="space-y-1.5">
            <Label>ملاحظات · Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Internal notes…"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء · Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "جاري الحفظ…" : "حفظ · Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

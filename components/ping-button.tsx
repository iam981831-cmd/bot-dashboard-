"use client"

import { useState } from "react"
import { Wifi, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface PingButtonProps {
  botId: string
  baseUrl: string | null
  onSuccess?: () => void
  size?: "sm" | "default"
}

export function PingButton({ botId, baseUrl, onSuccess, size = "default" }: PingButtonProps) {
  const [pinging, setPinging] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    ms?: number
    status?: number
  } | null>(null)

  const handlePing = async () => {
    if (!baseUrl) {
      toast.error("No URL configured for this bot")
      return
    }
    setPinging(true)
    setResult(null)
    try {
      const res = await fetch(`/api/bots/${botId}/ping`, { method: "POST" })
      const data = await res.json()
      setResult({ success: data.success, ms: data.responseTime, status: data.statusCode })
      if (data.success) {
        toast.success(`Ping OK — ${data.responseTime}ms (HTTP ${data.statusCode})`)
        onSuccess?.()
      } else {
        toast.error(`Ping failed — ${data.error || `HTTP ${data.statusCode}`}`)
      }
    } catch {
      setResult({ success: false })
      toast.error("Ping request failed")
    } finally {
      setPinging(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handlePing}
        disabled={pinging || !baseUrl}
        size={size}
        variant="outline"
      >
        <Wifi className={`h-4 w-4 mr-2 ${pinging ? "animate-pulse" : ""}`} />
        {pinging ? "Pinging…" : "Ping Now"}
      </Button>
      {result && (
        <span className={`flex items-center gap-1 text-sm font-medium ${result.success ? "text-green-500" : "text-red-500"}`}>
          {result.success ? (
            <><CheckCircle2 className="h-4 w-4" /> {result.ms}ms</>
          ) : (
            <><XCircle className="h-4 w-4" /> Failed</>
          )}
        </span>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap } from "lucide-react"

interface UsageData {
  today: number
  month: number
  costEUR: string
  daily: Record<string, number>
}

function MiniBarChart({ daily }: { daily: Record<string, number> }) {
  const entries = Object.entries(daily).slice(-14)
  if (!entries.length) return <p className="text-xs text-muted-foreground">No data yet</p>
  const max = Math.max(...entries.map(([, v]) => v), 1)

  return (
    <div className="flex items-end gap-[3px] h-16 w-full mt-2">
      {entries.map(([day, val]) => (
        <div
          key={day}
          className="flex-1 bg-blue-500/70 rounded-sm transition-all hover:bg-blue-500 cursor-default"
          style={{ height: `${Math.max(4, (val / max) * 100)}%` }}
          title={`${day}: ${val.toLocaleString()} tokens`}
        />
      ))}
    </div>
  )
}

export function TokenStats() {
  const [data, setData] = useState<UsageData | null>(null)

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) {
    return (
      <Card>
        <CardContent className="p-4 h-32 animate-pulse bg-muted/40 rounded-lg" />
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          استهلاك التوكنز · Token Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">اليوم · Today</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {data.today.toLocaleString()}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">الشهر · Month</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {data.month.toLocaleString()}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">التكلفة · Cost</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              €{data.costEUR}
            </p>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">آخر 14 يوم · Last 14 days</p>
          <MiniBarChart daily={data.daily} />
        </div>
      </CardContent>
    </Card>
  )
}

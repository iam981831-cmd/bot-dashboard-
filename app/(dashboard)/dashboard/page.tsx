"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  PlusCircle, Search, SlidersHorizontal, RefreshCw, Bot,
  MessageCircle, CalendarCheck, HelpCircle, Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { StatsCards } from "@/components/stats-cards"
import { BotCard } from "@/components/bot-card"
import { TokenStats } from "@/components/token-stats"
import type { Bot as BotType, BotStats } from "@/types"

export default function DashboardPage() {
  const [bots, setBots]               = useState<BotType[]>([])
  const [stats, setStats]             = useState<BotStats>({ total: 0, active: 0, inactive: 0, error: 0, maintenance: 0 })
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType]   = useState("all")

  const fetchBots = useCallback(async () => {
    try {
      const res = await fetch("/api/bots")
      if (!res.ok) return
      const data: BotType[] = await res.json()
      setBots(data)
      setStats({
        total:       data.length,
        active:      data.filter((b) => b.status === "Active").length,
        inactive:    data.filter((b) => b.status === "Inactive").length,
        error:       data.filter((b) => b.status === "Error").length,
        maintenance: data.filter((b) => b.status === "Maintenance").length,
      })
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBots()
    const interval = setInterval(fetchBots, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchBots])

  const filtered = bots.filter((b) => {
    const matchSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase()) ||
      b.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = filterStatus === "all" || b.status === filterStatus
    const matchType   = filterType   === "all" || b.type   === filterType
    return matchSearch && matchStatus && matchType
  })

  const botTypes = Array.from(new Set(bots.map((b) => b.type)))
  const activeLast24h = bots.filter((b) => {
    if (!b.lastSeenAt) return false
    return Date.now() - new Date(b.lastSeenAt).getTime() < 24 * 60 * 60 * 1000
  }).length

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            لوحة التحكم <span className="text-muted-foreground font-normal text-lg">· Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            إدارة ومراقبة جميع البوتات · Monitor all your bots
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="icon" onClick={fetchBots} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Link href="/bots/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">إضافة بوت · </span>Add Bot
            </Button>
          </Link>
        </div>
      </div>

      {/* Status overview strip */}
      {!loading && bots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              <div>
                <p className="text-xs text-muted-foreground">نشط اليوم · Active 24h</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{activeLast24h}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-3 flex items-center gap-3">
              <Activity className="h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">إجمالي · Total Bots</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardContent className="p-3 flex items-center gap-3">
              <HelpCircle className="h-4 w-4 text-orange-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">غير نشط · Inactive</p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{stats.inactive}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="p-3 flex items-center gap-3">
              <MessageCircle className="h-4 w-4 text-red-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">أخطاء · Errors</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full stats */}
      {!loading && <StatsCards stats={stats} />}

      {/* Token usage */}
      {!loading && <TokenStats />}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن بوت… · Search bots by name, tags…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل · All</SelectItem>
              <SelectItem value="Active">Active ✅</SelectItem>
              <SelectItem value="Inactive">Inactive ⚪</SelectItem>
              <SelectItem value="Error">Error ❌</SelectItem>
              <SelectItem value="Maintenance">Maintenance 🔧</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع · All Types</SelectItem>
              {botTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]" />
          نشط في آخر 24 ساعة · Active last 24h
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          غير نشط · Inactive 24h+
        </span>
      </div>

      {/* Bot grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-muted/50 p-6 rounded-full mb-4">
            <Bot className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">
            {bots.length === 0 ? "لا يوجد بوتات بعد · No bots yet" : "لا توجد نتائج · No results"}
          </h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-xs">
            {bots.length === 0
              ? "أضف أول بوت لك لتبدأ المراقبة · Add your first bot to start monitoring."
              : "جرّب تعديل فلتر البحث · Try adjusting your filters."}
          </p>
          {bots.length === 0 && (
            <Link href="/bots/new" className="mt-4">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add First Bot
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((bot) => (
            <BotCard key={bot.id} bot={bot} onRefresh={fetchBots} />
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { PlusCircle, Search, SlidersHorizontal, RefreshCw, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatsCards } from "@/components/stats-cards"
import { BotCard } from "@/components/bot-card"
import type { Bot as BotType, BotStats } from "@/types"

export default function DashboardPage() {
  const [bots, setBots] = useState<BotType[]>([])
  const [stats, setStats] = useState<BotStats>({
    total: 0,
    active: 0,
    inactive: 0,
    error: 0,
    maintenance: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")

  const fetchBots = useCallback(async () => {
    try {
      const res = await fetch("/api/bots")
      if (!res.ok) return
      const data: BotType[] = await res.json()
      setBots(data)
      setStats({
        total: data.length,
        active: data.filter((b) => b.status === "Active").length,
        inactive: data.filter((b) => b.status === "Inactive").length,
        error: data.filter((b) => b.status === "Error").length,
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
  }, [fetchBots])

  const filtered = bots.filter((b) => {
    const matchSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase()) ||
      b.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = filterStatus === "all" || b.status === filterStatus
    const matchType = filterType === "all" || b.type === filterType
    return matchSearch && matchStatus && matchType
  })

  const botTypes = Array.from(new Set(bots.map((b) => b.type)))

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Overview of all your bots
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchBots}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Link href="/bots/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Bot
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {!loading && <StatsCards stats={stats} />}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bots by name, description, or tags…"
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
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Error">Error</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {botTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bot grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-lg bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-muted/50 p-6 rounded-full mb-4">
            <Bot className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">
            {bots.length === 0 ? "No bots yet" : "No bots match your filters"}
          </h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-xs">
            {bots.length === 0
              ? "Add your first bot to start monitoring it from this dashboard."
              : "Try adjusting your search or filters."}
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

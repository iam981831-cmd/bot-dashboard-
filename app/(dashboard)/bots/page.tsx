"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  PlusCircle,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Bot,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BotCard } from "@/components/bot-card"
import type { Bot as BotType } from "@/types"

export default function BotsPage() {
  const [bots, setBots] = useState<BotType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")

  const fetchBots = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/bots")
      if (res.ok) {
        const data = await res.json()
        setBots(data)
      }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Bots</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {bots.length} bot{bots.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchBots} title="Refresh">
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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, description, or tags…"
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

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-muted/50 p-6 rounded-full mb-4">
            <Bot className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">
            {bots.length === 0 ? "No bots registered yet" : "No results found"}
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            {bots.length === 0
              ? "Click \"Add Bot\" to register your first bot."
              : "Try different search terms or filters."}
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

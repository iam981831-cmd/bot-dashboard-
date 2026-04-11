"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  Calendar,
  Tag,
  Globe,
  Key,
  FileText,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BotForm } from "@/components/bot-form"
import { ActivityLog } from "@/components/activity-log"
import { PingButton } from "@/components/ping-button"
import { formatDate, timeAgo } from "@/lib/utils"
import type { Bot, PingLog, ActivityLog as ActivityLogType } from "@/types"

function getStatusVariant(status: string): "success" | "error" | "warning" | "maintenance" | "outline" {
  switch (status) {
    case "Active": return "success"
    case "Error": return "error"
    case "Inactive": return "warning"
    case "Maintenance": return "maintenance"
    default: return "outline"
  }
}

export default function BotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const botId = params.id as string

  const [bot, setBot] = useState<Bot | null>(null)
  const [pingLogs, setPingLogs] = useState<PingLog[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLogType[]>([])
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState(
    searchParams.get("edit") === "true" ? "edit" : "overview"
  )

  const fetchData = useCallback(async () => {
    try {
      const [botRes, pingRes, activityRes] = await Promise.all([
        fetch(`/api/bots/${botId}`),
        fetch(`/api/bots/${botId}/ping-history`),
        fetch(`/api/bots/${botId}/activity`),
      ])

      if (!botRes.ok) {
        router.push("/bots")
        return
      }

      const [botData, pingData, activityData] = await Promise.all([
        botRes.json(),
        pingRes.ok ? pingRes.json() : [],
        activityRes.ok ? activityRes.json() : [],
      ])

      setBot(botData)
      setPingLogs(pingData)
      setActivityLogs(activityData)
    } catch {
      toast.error("Failed to load bot data")
    } finally {
      setLoading(false)
    }
  }, [botId, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/bots/${botId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Bot deleted")
      router.push("/bots")
    } catch {
      toast.error("Failed to delete bot")
      setDeleting(false)
      setShowDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted/50 animate-pulse rounded" />
        <div className="h-32 bg-muted/50 animate-pulse rounded-lg" />
        <div className="h-64 bg-muted/50 animate-pulse rounded-lg" />
      </div>
    )
  }

  if (!bot) return null

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/bots">
              <Button variant="ghost" size="sm" className="-ml-2 mb-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                All Bots
              </Button>
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{bot.name}</h1>
              <Badge variant={getStatusVariant(bot.status)}>{bot.status}</Badge>
              <Badge variant="outline">{bot.type}</Badge>
            </div>
            {bot.description && (
              <p className="text-muted-foreground mt-1">{bot.description}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("edit")}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
            <TabsTrigger value="ping-history">Ping History</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4">
            {/* Quick actions */}
            <Card>
              <CardContent className="pt-4">
                <PingButton
                  botId={bot.id}
                  baseUrl={bot.baseUrl}
                  onSuccess={fetchData}
                />
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Base URL</p>
                      {bot.baseUrl ? (
                        <p className="text-sm font-mono break-all">{bot.baseUrl}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Not set</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Key className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">API Key</p>
                      <p className="text-sm font-mono">
                        {bot.apiKeyMasked || (
                          <span className="text-muted-foreground italic">Not set</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Last Seen</p>
                      <p className="text-sm">{timeAgo(bot.lastSeenAt)}</p>
                      {bot.lastSeenAt && (
                        <p className="text-xs text-muted-foreground">
                          {formatDate(bot.lastSeenAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm">{formatDate(bot.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {bot.tags.length > 0 && (
                  <div className="flex items-start gap-2 pt-2 border-t border-border">
                    <Tag className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                    <div className="flex flex-wrap gap-1.5">
                      {bot.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {bot.notes && (
                  <div className="flex items-start gap-2 pt-2 border-t border-border">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm whitespace-pre-wrap">{bot.notes}</p>
                    </div>
                  </div>
                )}

                {bot.pingInterval && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Auto-ping every{" "}
                      <span className="text-foreground font-medium">
                        {bot.pingInterval} minutes
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent ping summary */}
            {pingLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Pings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-500">
                        {pingLogs.filter((p) => p.success).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Successful</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-500">
                        {pingLogs.filter((p) => !p.success).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {pingLogs.filter((p) => p.responseTime).length > 0
                          ? Math.round(
                              pingLogs
                                .filter((p) => p.responseTime)
                                .reduce((a, b) => a + (b.responseTime || 0), 0) /
                                pingLogs.filter((p) => p.responseTime).length
                            )
                          : "—"}
                        {pingLogs.filter((p) => p.responseTime).length > 0 && (
                          <span className="text-sm font-normal ml-0.5">ms</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg Response</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ACTIVITY LOG */}
          <TabsContent value="activity">
            <Card>
              <CardContent className="pt-6">
                <ActivityLog
                  botId={bot.id}
                  logs={activityLogs}
                  onRefresh={fetchData}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* PING HISTORY */}
          <TabsContent value="ping-history">
            <Card>
              <CardHeader>
                <CardTitle>Ping History (Last 20)</CardTitle>
              </CardHeader>
              <CardContent>
                {pingLogs.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    No ping history yet. Use the Ping button to start.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>HTTP</TableHead>
                        <TableHead>Response</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pingLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {timeAgo(log.createdAt)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-medium text-sm ${
                                log.success ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {log.success ? "✓ OK" : "✗ Failed"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.statusCode ? (
                              <span
                                className={
                                  log.statusCode < 300
                                    ? "text-green-500"
                                    : "text-red-500"
                                }
                              >
                                {log.statusCode}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.responseTime ? (
                              <span>{log.responseTime}ms</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                            {log.error || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* EDIT */}
          <TabsContent value="edit">
            <BotForm bot={bot} mode="edit" />
          </TabsContent>
        </Tabs>

        {/* Danger Zone */}
        {activeTab !== "edit" && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive text-base">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete this bot</p>
                <p className="text-xs text-muted-foreground">
                  Permanently removes the bot, all ping logs, and activity history.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Bot
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

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
              {deleting ? "Deleting…" : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

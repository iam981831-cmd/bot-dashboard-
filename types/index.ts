export type BotType =
  | "Telegram"
  | "Discord"
  | "WhatsApp"
  | "Slack"
  | "Custom API"
  | "Other"

export type BotStatus = "Active" | "Inactive" | "Error" | "Maintenance"

export type ActivityType = "info" | "warning" | "error" | "success"

export interface Bot {
  id: string
  name: string
  description: string | null
  type: string
  status: string
  baseUrl: string | null
  apiKeyMasked: string | null
  tags: string[]
  notes: string | null
  pingInterval: number | null
  createdAt: string
  updatedAt: string
  lastSeenAt: string | null
}

export interface PingLog {
  id: string
  botId: string
  responseTime: number | null
  statusCode: number | null
  success: boolean
  error: string | null
  createdAt: string
}

export interface ActivityLog {
  id: string
  botId: string
  message: string
  type: string
  createdAt: string
}

export interface BotStats {
  total: number
  active: number
  inactive: number
  error: number
  maintenance: number
}

export interface StatPeriod {
  conversations: number
  appointments: number
  unanswered: number
}

export interface BotConversationStats {
  today: StatPeriod
  week: StatPeriod
  month: StatPeriod
  total: StatPeriod
}

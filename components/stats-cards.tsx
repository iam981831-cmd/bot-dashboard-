import { Bot, CheckCircle2, XCircle, AlertTriangle, Wrench } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { BotStats } from "@/types"

interface StatsCardsProps {
  stats: BotStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Bots",
      value: stats.total,
      icon: Bot,
      className: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active",
      value: stats.active,
      icon: CheckCircle2,
      className: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Inactive",
      value: stats.inactive,
      icon: XCircle,
      className: "text-gray-400",
      bg: "bg-gray-500/10",
    },
    {
      label: "Error",
      value: stats.error,
      icon: AlertTriangle,
      className: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "Maintenance",
      value: stats.maintenance,
      icon: Wrench,
      className: "text-blue-400",
      bg: "bg-blue-400/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`${card.bg} p-2 rounded-lg`}>
                  <Icon className={`h-5 w-5 ${card.className}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

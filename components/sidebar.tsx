"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Bot,
  PlusCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/bots", icon: Bot, label: "All Bots" },
  { href: "/bots/new", icon: PlusCircle, label: "Add New Bot" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem("sidebar-collapsed")
      if (saved !== null) setCollapsed(JSON.parse(saved))
    } catch {}
  }, [])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(next))
    } catch {}
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch {
      toast.error("Logout failed")
    }
  }

  const isActive = (href: string) => {
    if (href === "/bots") {
      return pathname === "/bots" || (pathname.startsWith("/bots/") && pathname !== "/bots/new")
    }
    return pathname === href || pathname.startsWith(href + "/")
  }

  if (!mounted) return null

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex flex-col h-screen bg-card border-r border-border transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border h-16">
          {!collapsed && (
            <span className="font-bold text-base text-foreground truncate">
              BotManager
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className={cn("shrink-0", collapsed && "mx-auto")}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const navLink = (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </div>
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )
            }
            return navLink
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-border space-y-1">
          <div
            className={cn(
              "flex items-center px-2 py-1",
              collapsed ? "justify-center" : "justify-between"
            )}
          >
            {!collapsed && (
              <span className="text-xs text-muted-foreground ml-1">Theme</span>
            )}
            <ThemeToggle />
          </div>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}

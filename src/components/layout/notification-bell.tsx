"use client"

import { useEffect, useState } from "react"
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle2, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: any) => !n.isRead).length)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true })
      })
      if (res.ok) fetchNotifications()
    } catch (e) {
      console.error(e)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "all", isRead: true })
      })
      if (res.ok) fetchNotifications()
    } catch (e) {
      console.error(e)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "CRITICAL": return <XCircle className="h-4 w-4 text-destructive" />
      case "WARNING": return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "SUCCESS": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="relative group" />}>
          <Bell className="h-5 w-5 transition-transform group-hover:rotate-12" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-destructive animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] max-h-[480px] overflow-hidden flex flex-col p-0">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-4 flex items-center justify-between border-b">
            <span>แจ้งเตือนล่าสุด</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary hover:bg-transparent" onClick={markAllAsRead}>
                อ่านทั้งหมด
              </Button>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
             <div className="flex items-center justify-center p-8">
               <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
             </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              ไม่มีการแจ้งเตือนใหม่
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem 
                key={n._id} 
                className={cn("flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-muted border-b last:border-0", !n.isRead && "bg-muted/30 font-medium")}
                onClick={() => markAsRead(n._id)}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getIcon(n.type)}
                    <span className="text-sm">{n.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 uppercase">
                    {new Intl.RelativeTimeFormat("th").format(-Math.round((Date.now() - new Date(n.createdAt).getTime()) / 60000), "minute").replace("ใน ", "") + " ที่ผ่านมา"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
                  {n.message}
                </p>
                {n.link && (
                    <Link href={n.link} className="pl-6 text-[10px] text-primary hover:underline mt-1">
                        ดูรายละเอียด
                    </Link>
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="p-2">
            <Link href="/dashboard/notifications">
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
                    ดูทั้งหมด
                </Button>
            </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { getSidebarNavItems } from "@/config/navigation"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const role = session?.user?.role || "OFFICER"
  const navItems = getSidebarNavItems(role)

  return (
    <div className="hidden md:flex flex-col h-screen w-[220px] lg:w-[260px] shrink-0 border-r bg-card text-card-foreground">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px]">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">ระบบติดตามงาน อบต.</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid items-start px-3 text-sm font-medium gap-1">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
            const hasItems = item.items && item.items.length > 0

            return (
              <div key={index} className="flex flex-col gap-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted/50",
                    isActive ? "bg-muted text-primary hover:bg-muted font-medium" : ""
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
                {hasItems && (isActive || pathname.startsWith(item.href)) && (
                  <div className="flex flex-col gap-1 ml-9 mt-1 mb-2">
                    {item.items.map((subItem: any, subIndex: number) => {
                      const isSubActive = pathname === subItem.href
                      return (
                        <Link
                          key={subIndex}
                          href={subItem.href}
                          className={cn(
                            "text-sm px-2 py-1.5 rounded-md transition-colors",
                            isSubActive 
                              ? "text-primary font-medium bg-muted/30" 
                              : "text-muted-foreground hover:text-primary hover:bg-muted/30"
                          )}
                        >
                          {subItem.title}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

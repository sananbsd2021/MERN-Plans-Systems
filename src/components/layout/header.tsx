"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { getSidebarNavItems } from "@/config/navigation"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/layout/notification-bell"
import { useState } from "react"

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const role = session?.user?.role || "OFFICER"
  const navItems = getSidebarNavItems(role)

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 shrink-0">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="outline" size="icon" className="shrink-0 md:hidden" />}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col w-[280px] p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex h-14 items-center border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold" onClick={() => setOpen(false)}>
              <span className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">ระบบติดตามงาน อบต.</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="grid gap-2 px-4 text-sm font-medium">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-muted",
                      isActive ? "bg-muted text-primary font-medium" : ""
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                )
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        {/* Can add search or breadcrumbs here later */}
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger className="relative flex h-8 w-8 items-center justify-center rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground mt-1">
                {session?.user?.role}
              </p>
            </div>
            <div className="-mx-1 my-1 h-px bg-border" />
            <DropdownMenuItem onClick={() => signOut()}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

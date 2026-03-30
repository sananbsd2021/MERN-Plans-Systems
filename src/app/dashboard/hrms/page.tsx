"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, CalendarDays, ClipboardCheck, Loader2, UserPlus, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function HRDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/hrms/dashboard')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Failed to load HR stats", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">ระบบบริหารงานบุคคล (HRMS)</h2>
        <div className="flex items-center space-x-2">
          <Link 
            href="/dashboard/hrms/employees" 
            className={buttonVariants({ variant: "default", className: "gap-2" })}
          >
            <UserPlus className="h-4 w-4" /> เพิ่มพนักงาน
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">บุคลากรทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeEmployees || 0} คนที่กำลังปฏิบัติงาน
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กอง / สำนัก</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDepartments || 0}</div>
            <p className="text-xs text-muted-foreground">หน่วยงานภายในทั้งหมด</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คำร้องขอลา</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.pendingLeaves || 0}</div>
            <p className="text-xs text-muted-foreground">รอดำเนินการอนุมัติ</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ลงเวลาเข้างาน</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">--</div>
            <p className="text-xs text-muted-foreground">สถิติวันนี้</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>บุคลากรล่าสุด</CardTitle>
            <CardDescription>รายชื่อพนักงานที่เพิ่มเข้าระบบล่าสุด 5 อันดับ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.latestEmployees?.map((emp: any) => (
                <div key={emp._id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-muted-foreground">{emp.position} | {emp.departmentId?.name || "ไม่ระบุกอง"}</p>
                    </div>
                  </div>
                  <Badge variant={emp.status === "ACTIVE" ? "default" : "secondary"}>
                    {emp.status}
                  </Badge>
                </div>
              ))}
              {(!stats?.latestEmployees || stats.latestEmployees.length === 0) && (
                <div className="py-8 text-center text-muted-foreground italic text-sm">
                  ยังไม่มีข้อมูลบุคลากรในระบบ
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link 
                href="/dashboard/hrms/employees" 
                className="text-sm text-primary flex items-center gap-1 hover:underline"
              >
                ดูพนักงานทั้งหมด <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>เมนูด่วน (HR Actions)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link 
              href="/dashboard/hrms/employees" 
              className={cn(buttonVariants({ variant: "outline" }), "justify-start gap-3 h-12")}
            >
              <Users className="h-4 w-4" /> ทะเบียนประวัติบุคลากร
            </Link>
            <Link 
              href="/dashboard/hrms/departments" 
              className={cn(buttonVariants({ variant: "outline" }), "justify-start gap-3 h-12")}
            >
              <Building2 className="h-4 w-4" /> จัดการหน่วยงาน/กอง
            </Link>
            <Link 
              href="/dashboard/hrms/attendance" 
              className={cn(buttonVariants({ variant: "outline" }), "justify-start gap-3 h-12")}
            >
              <ClipboardCheck className="h-4 w-4" /> บันทึกเวลาเข้า-ออก
            </Link>
            <Link 
              href="/dashboard/hrms/leaves" 
              className={cn(buttonVariants({ variant: "outline" }), "justify-start gap-3 h-12")}
            >
              <CalendarDays className="h-4 w-4" /> อนุมัติการลาพักผ่อน
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

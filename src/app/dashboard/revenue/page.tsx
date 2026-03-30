"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Banknote,
  Users,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Loader2,
  TrendingUp,
  Landmark
} from "lucide-react"
import Link from "next/link"

export default function RevenueDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/revenue/dashboard")
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const { summary, recentPayments } = data || { summary: {}, recentPayments: [] }
  const percentCollected = summary.totalExpected > 0
    ? (summary.totalCollected / summary.totalExpected) * 100
    : 0

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-blue-800">ระบบงานจัดเก็บรายได้</h2>
          <p className="text-muted-foreground">ภาพรวมการจัดเก็บภาษี รายได้ และค่าธรรมเนียมต่างๆ</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/revenue/payers" className={buttonVariants({ variant: "outline" })}>
            <Users className="mr-2 h-4 w-4" /> รายชื่อผู้เสียภาษี
          </Link>
          <Link href="/dashboard/revenue/assets" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" /> ประเมินรายได้ใหม่
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายได้ประมาณการ (ปีปัจจุบัน)</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{summary.totalExpected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">เป้าหมายการจัดเก็บประจำปี</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">จัดเก็บได้แล้ว</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">฿{summary.totalCollected.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${Math.min(percentCollected, 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-medium">{percentCollected.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">จำนวนผู้เสียภาษี</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.payerCount.toLocaleString()} ราย</div>
            <p className="text-xs text-muted-foreground">ในระบบจัดเก็บข้อมูล</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ทรัพย์สินในข่ายภาษี</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.assetCount.toLocaleString()} รายการ</div>
            <p className="text-xs text-muted-foreground">ที่ดิน, โรงเรือน, และป้าย</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>รายการรับชำระล่าสุด</CardTitle>
            <CardDescription>แสดงประวัติการออกใบเสร็จ 5 รายการล่าสุด</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วัน/เวลา</TableHead>
                  <TableHead>ผู้เสียภาษี</TableHead>
                  <TableHead className="text-right">จำนวนเงิน</TableHead>
                  <TableHead className="text-center">ประเภท</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((p: any) => (
                  <TableRow key={p._id}>
                    <TableCell className="text-xs">{new Date(p.paymentDate).toLocaleDateString('th-TH')}</TableCell>
                    <TableCell className="font-medium">{p.payerId?.name}</TableCell>
                    <TableCell className="text-right text-green-600 font-bold">฿{p.amountPaid.toLocaleString()}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">{p.paymentMethod}</TableCell>
                  </TableRow>
                ))}
                {recentPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                      ยังไม่มีรายการชำระเงินในระบบ
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>ทางลัดงานจัดเก็บ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <Link href="/dashboard/revenue/payers" className={buttonVariants({ variant: "outline", className: "justify-start h-12" })}>
                <Plus className="mr-2 h-4 w-4" /> เพิ่มผู้เสียภาษีรายใหม่
              </Link>
              <Link href="/dashboard/revenue/assets" className={buttonVariants({ variant: "outline", className: "justify-start h-12" })}>
                <Landmark className="mr-2 h-4 w-4" /> บันทึกทรัพย์สิน/สิ่งปลูกสร้าง
              </Link>
              <Link href="/dashboard/revenue/reports" className={buttonVariants({ variant: "outline", className: "justify-start h-12" })}>
                <Search className="mr-2 h-4 w-4" /> ตรวจสอบยอดค้างชำระ
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t font-medium text-sm">
              <h4 className="mb-4">เป้าหมายแบ่งตามประเภท</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ภาษีที่ดิน/สิ่งปลูกสร้าง</span>
                  <span className="font-bold">75%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ภาษีป้าย</span>
                  <span className="font-bold">45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ค่าธรรมเนียม/ใบอนุญาต</span>
                  <span className="font-bold">90%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

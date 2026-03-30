"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Package, 
  Wrench, 
  AlertTriangle, 
  ArrowRight, 
  TrendingUp, 
  Plus, 
  History,
  ClipboardList,
  ArrowRightLeft,
  FolderTree
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function AssetDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/assets/dashboard")
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-muted-foreground italic">กำลังโหลดข้อมูลแดชบอร์ด...</div>

  const { summary, recentMaintenance, statusDistribution } = data || {}

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ระบบทะเบียนทรัพย์สินและพัสดุ</h2>
          <p className="text-muted-foreground">จัดการและติดตามครุภัณฑ์ ที่ดิน และสิ่งปลูกสร้างของหน่วยงาน</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/assets/registry" className={buttonVariants({ variant: "outline" })}>
            <ClipboardList className="mr-2 h-4 w-4" /> ทะเบียนทรัพย์สินและพัสดุ
          </Link>
          <Link href="/dashboard/assets/supplies" className={buttonVariants({ variant: "outline" })}>
            <Package className="mr-2 h-4 w-4" /> บริหารจัดการพัสดุ
          </Link>
          <Link href="/dashboard/assets/categories" className={buttonVariants({ variant: "outline" })}>
            <FolderTree className="mr-2 h-4 w-4" /> จัดการหมวดหมู่
          </Link>
          <Link href="/dashboard/assets/inventory" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" /> ลงทะเบียนครุภัณฑ์ใหม่
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ครุภัณฑ์ทั้งหมด</CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalCount || 0} รายการ</div>
            <p className="text-xs text-muted-foreground font-semibold">ทรัพย์สินที่อยู่ในการครอบครอง</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">มูลค่ารวม (ราคาทุน)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{(summary?.totalValue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground font-semibold">งบประมาณที่ลงทุนไปทั้งหมด</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอการซ่อมแซม / ชำรุด</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary?.brokenCount || 0} รายการ</div>
            <p className="text-xs text-muted-foreground font-semibold">ครุภัณฑ์ที่ไม่สามารถใช้งานได้</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สภาพปกติ (Active)</CardTitle>
            <Badge className="bg-green-500">{summary?.activeCount || 0}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((summary?.activeCount || 0) / (summary?.totalCount || 1) * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground font-semibold">ความพร้อมใช้งานของทรัพย์สิน</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>ประวัติการซ่อมบำรุงล่าสุด</CardTitle>
            <CardDescription>การแจ้งซ่อมและบันทึกค่าใช้จ่ายในช่วงที่ผ่านมา</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ครุภัณฑ์</TableHead>
                  <TableHead>วันที่ซ่อม</TableHead>
                  <TableHead className="text-right">ค่าใช้จ่าย</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMaintenance?.map((m: any) => (
                  <TableRow key={m._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{m.assetId?.name}</span>
                        <span className="text-[10px] text-muted-foreground">{m.assetId?.assetCode}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(m.maintenanceDate).toLocaleDateString('th-TH')}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">฿{m.cost.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {(!recentMaintenance || recentMaintenance.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic">ยังไม่มีประวัติการซ่อมบำรุง</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="mt-4">
              <Link href="/dashboard/assets/maintenance" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                ดูประวัติการซ่อมบำรุงทั้งหมด <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>สถานะทรัพย์สิน</CardTitle>
            <CardDescription>การกระจายตัวตามสภาพการใช้งาน</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusDistribution?.map((item: any) => (
              <div key={item._id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium italic">{item._id}</span>
                  <span>{item.count} รายการ</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item._id === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ width: `${(item.count / (summary?.totalCount || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            
            <div className="pt-6 border-t mt-6">
              <h4 className="text-sm font-semibold mb-4">เมนูทางลัด</h4>
              <div className="grid grid-cols-1 gap-2">
                <Link href="/dashboard/assets/maintenance" className={buttonVariants({ variant: "outline", className: "justify-start h-12" })}>
                  <History className="mr-2 h-4 w-4" /> บันทึกประวัติการซ่อมบำรุง
                </Link>
                <Link href="/dashboard/assets/transfers" className={buttonVariants({ variant: "outline", className: "justify-start h-12" })}>
                  <ArrowRightLeft className="mr-2 h-4 w-4 text-blue-600" /> โอนย้ายครุภัณฑ์ระหว่างกอง
                </Link>
                <Link href="/dashboard/assets/supplies" className={buttonVariants({ variant: "outline", className: "justify-start h-12" })}>
                  <Package className="mr-2 h-4 w-4 text-orange-600" /> เบิกจ่ายพัสดุ/วัสดุ
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

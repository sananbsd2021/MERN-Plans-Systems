"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Plus, 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Search,
  Filter,
  MoreVertical,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// import { toast } from "sonner"
const toast = {
  error: (msg: string) => window.alert(msg),
  success: (msg: string) => window.alert(msg),
}

export default function SalarySlipsPage() {
  const [slips, setSlips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const fetchSlips = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/salary-slips?month=${month}&year=${year}`)
      const data = await res.json()
      setSlips(data)
    } catch (error) {
      console.error("Failed to fetch slips", error)
      toast.error("Failed to load salary slips")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlips()
  }, [month, year])

  const handlePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/salary-slips/${id}/publish`, { method: "POST" })
      if (res.ok) {
        toast.success("Slip published successfully")
        fetchSlips()
      }
    } catch (error) {
      toast.error("Failed to publish slip")
    }
  }

  const filteredSlips = slips.filter(slip => 
    `${slip.employeeId?.firstName} ${slip.employeeId?.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    slip.employeeId?.employeeId?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">จัดการสลิปเงินเดือน</h2>
          <p className="text-muted-foreground mt-1">บริหารจัดการและออกสลิปเงินเดือนรายเดือนสำหรับพนักงาน</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/hrms/salary-slips/upload">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Upload className="h-4 w-4" /> นำเข้าข้อมูล (Excel)
            </Button>
          </Link>
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> สร้างรายการใหม่
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">รายการสลิปเงินเดือน</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="ค้นหาชื่อหรือรหัสพนักงาน..." 
                  className="w-[280px]" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <select 
                  className="h-9 w-[120px] rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>เดือน {m}</option>
                  ))}
                </select>
                <select 
                  className="h-9 w-[100px] rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>ปี {y + 543}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสพนักงาน</TableHead>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead className="text-right">รายรับสุทธิ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSlips.map((slip) => (
                  <TableRow key={slip._id}>
                    <TableCell className="font-medium">{slip.employeeId?.employeeId}</TableCell>
                    <TableCell>{slip.employeeId?.firstName} {slip.employeeId?.lastName}</TableCell>
                    <TableCell className="text-muted-foreground">{slip.employeeId?.position}</TableCell>
                    <TableCell className="text-right font-bold text-slate-700">
                      ฿{slip.netSalary.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {slip.status === "PUBLISHED" ? (
                        <Badge variant="default" className="bg-emerald-50 text-emerald-700 border-emerald-100 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> เผยแพร่แล้ว
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" /> ร่าง
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Eye className="h-3.5 w-3.5" /> ดูตัวอย่าง
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handlePublish(slip._id)}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> เผยแพร่สลิป
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Download className="h-3.5 w-3.5" /> ดาวน์โหลด PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSlips.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      ไม่พบข้อมูลสลิปเงินเดือนในเครื่องข่ายนี้
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

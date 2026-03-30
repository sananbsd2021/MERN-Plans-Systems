"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, AlertCircle, FileText, Download } from "lucide-react"

export default function ReportsPage() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    year: new Date().getFullYear().toString(),
    status: "PENDING"
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams(filter).toString()
      const res = await fetch(`/api/revenue/assessments?${query}`)
      const data = await res.json()
      setAssessments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalOutstanding = assessments.reduce((sum, a) => sum + (a.status !== "PAID" ? a.amountDue : 0), 0)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">รายงานยอดค้างชำระ</h2>
          <p className="text-muted-foreground">ตรวจสอบและติดตามรายการภาษีที่ยังไม่ได้ดำเนินการชำระ</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> ส่งออกรายงาน (Excel)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">ตัวกรองข้อมูล</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>ปีงบประมาณ</Label>
              <Input 
                type="number" 
                value={filter.year} 
                onChange={(e) => setFilter({...filter, year: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label>สถานะ</Label>
              <Select value={filter.status} onValueChange={(v: string | null) => setFilter({...filter, status: v || "ALL"})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">ค้างชำระ (Pending)</SelectItem>
                  <SelectItem value="OVERDUE">เกินกำหนด (Overdue)</SelectItem>
                  <SelectItem value="PAID">ชำระแล้ว (Paid)</SelectItem>
                  <SelectItem value="ALL">ทั้งหมด (All)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full mt-2" onClick={fetchData}>
              <Search className="mr-2 h-4 w-4" /> ค้นหา
            </Button>
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-4">
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-8100 italic">ยอดค้างชำระรวม (ตามตัวกรอง)</p>
                  <h3 className="text-2xl font-bold text-orange-700">฿{totalOutstanding.toLocaleString()}</h3>
                </div>
              </div>
              <Badge variant="outline" className="bg-white border-orange-300 text-orange-700 font-bold">
                {assessments.length} รายการ
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ผู้เสียภาษี</TableHead>
                      <TableHead>ประเภททรัพย์สิน</TableHead>
                      <TableHead>ปี</TableHead>
                      <TableHead className="text-right">ยอดที่ต้องชำระ</TableHead>
                      <TableHead className="text-center">สถานะ</TableHead>
                      <TableHead className="text-right">วันครบกำหนด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((a) => (
                      <TableRow key={a._id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{a.payerId?.name}</span>
                            <span className="text-[10px] text-muted-foreground">{a.payerId?.taxId}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs uppercase">{a.assetId?.type}</TableCell>
                        <TableCell>{a.year}</TableCell>
                        <TableCell className="text-right font-bold">฿{a.amountDue.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={a.status === "PAID" ? "default" : "secondary"} className={a.status === "PAID" ? "bg-green-500 hover:bg-green-600" : ""}>
                            {a.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {new Date(a.dueDate).toLocaleDateString('th-TH')}
                        </TableCell>
                      </TableRow>
                    ))}
                    {assessments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                          ไม่พบข้อมูลค้างชำระตามเงื่อนไขที่ระบุ
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

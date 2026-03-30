"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ClipboardCheck, Clock, CheckCircle2, MapPin, ExternalLink } from "lucide-react"

export default function AttendancePage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [selectedEmp, setSelectedEmp] = useState("")
  const [status, setStatus] = useState("PRESENT")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const query = selectedEmp ? `?employeeId=${selectedEmp}&summary=true` : "?summary=true"
      const [empRes, recRes] = await Promise.all([
        fetch("/api/hrms/employees"),
        fetch(`/api/hrms/attendance${query}`)
      ])
      const empData = await empRes.json()
      const recData = await recRes.json()
      setEmployees(Array.isArray(empData) ? empData : [])
      
      if (recData.records) {
        setRecords(recData.records)
        setStats(recData.stats)
      } else {
        setRecords(Array.isArray(recData) ? recData : [])
        setStats(null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedEmp])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAttendance = async (type: "checkIn" | "checkOut") => {
    if (!selectedEmp) return
    setSubmitting(true)
    try {
      const payload: any = {
        employeeId: selectedEmp,
        date: new Date().toISOString(),
        status
      }
      if (type === "checkIn") payload.checkIn = new Date().toISOString()
      if (type === "checkOut") payload.checkOut = new Date().toISOString()

      const res = await fetch("/api/hrms/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) throw new Error("Failed to record attendance")
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">บันทึกเวลาปฏิบัติราชการ</h2>
          <p className="text-muted-foreground">บันทึกเวลาเข้า-ออก และตรวจสอบความสม่ำเสมอในการปฏิบัติงาน</p>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ความสม่ำเสมอ (Consistency)</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.consistencyRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">อัตราการมาทำงานตรงเวลา</p>
              <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500" 
                  style={{ width: `${stats.consistencyRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">มาทำงาน (On-time)</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.onTimeDays}</div>
              <p className="text-xs text-muted-foreground">จำนวนวันที่มาตรงเวลา</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">มาสาย (Late)</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.lateDays}</div>
              <p className="text-xs text-muted-foreground">จำนวนวันที่มาสาย</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รวมวันทำงาน (Total Days)</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDays}</div>
              <p className="text-xs text-muted-foreground">จำนวนวันปฏิบัติราชการทั้งหมด</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>บันทึกเวลาวันนี้</CardTitle>
            <CardDescription>{new Date().toLocaleDateString('th-TH', { dateStyle: 'full' })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">เลือกบุคลากร</label>
              <Select value={selectedEmp} onValueChange={(v: string | null) => setSelectedEmp(v || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกพนักงาน..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">สถานะ</label>
              <Select value={status} onValueChange={(v: string | null) => setStatus(v || "PRESENT")}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">ปกติ (Present)</SelectItem>
                  <SelectItem value="LATE">สาย (Late)</SelectItem>
                  <SelectItem value="HALF_DAY">ครึ่งวัน (Half Day)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700" 
                onClick={() => handleAttendance("checkIn")}
                disabled={!selectedEmp || submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                ลงเวลาเข้า
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 gap-2" 
                onClick={() => handleAttendance("checkOut")}
                disabled={!selectedEmp || submitting}
              >
                <Clock className="h-4 w-4" />
                ลงเวลาออก
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>สถิติการเข้างานล่าสุด</CardTitle>
            <CardDescription>แสดงข้อมูลการลงเวลา 10 รายการล่าสุด</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วัน/เดือน/ปี</TableHead>
                    <TableHead>รายชื่อ</TableHead>
                    <TableHead>เวลาเข้า</TableHead>
                    <TableHead>เวลาออก</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-center">พิกัด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.slice(0, 10).map((record) => (
                    <TableRow key={record._id}>
                      <TableCell className="text-xs">{new Date(record.date).toLocaleDateString('th-TH')}</TableCell>
                      <TableCell className="font-medium">{record.employeeId?.firstName} {record.employeeId?.lastName}</TableCell>
                      <TableCell>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : "-"}</TableCell>
                      <TableCell>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={record.status === "PRESENT" ? "default" : record.status === "LATE" ? "secondary" : "outline"}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {record.checkInLocation && (
                            <a 
                              href={`https://www.google.com/maps?q=${record.checkInLocation.lat},${record.checkInLocation.lng}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              title="Check-in Location"
                              className="text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                              <MapPin className="h-4 w-4" />
                            </a>
                          )}
                          {record.checkOutLocation && (
                            <a 
                              href={`https://www.google.com/maps?q=${record.checkOutLocation.lat},${record.checkOutLocation.lng}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              title="Check-out Location"
                              className="text-rose-600 hover:text-rose-700 transition-colors"
                            >
                              <MapPin className="h-4 w-4" />
                            </a>
                          )}
                          {!record.checkInLocation && !record.checkOutLocation && (
                            <span className="text-slate-300">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {records.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                        ยังไม่มีข้อมูลการลงเวลา
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
  )
}

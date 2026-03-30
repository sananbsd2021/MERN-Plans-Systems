"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, CheckCircle, XCircle, CalendarDays } from "lucide-react"

export default function LeavesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Form State
  const [formData, setFormData] = useState({
    employeeId: "",
    leaveType: "ANNUAL",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ""
  })

  const [approvalData, setApprovalData] = useState({
    status: "APPROVED",
    comment: ""
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [empRes, leaveRes] = await Promise.all([
        fetch("/api/hrms/employees"),
        fetch("/api/hrms/leaves")
      ])
      const empData = await empRes.json()
      const leaveData = await leaveRes.json()
      setEmployees(Array.isArray(empData) ? empData : [])
      setLeaves(Array.isArray(leaveData) ? leaveData : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/hrms/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to submit leave request")
      setDialogOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproval = async () => {
    if (!selectedLeave) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/hrms/leaves/${selectedLeave._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approvalData),
      })
      if (!res.ok) throw new Error("Failed to process approval")
      setApprovalDialogOpen(false)
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
          <h2 className="text-3xl font-bold tracking-tight">การบันทึกวันลา</h2>
          <p className="text-muted-foreground">จัดการการลาพักผ่อน ลาป่วย และการอนุมัติการลา</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> สร้างใบลา
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการคำขอลา</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รายชื่อบุคลากร</TableHead>
                  <TableHead>ประเภทการลา</TableHead>
                  <TableHead>ระยะเวลา</TableHead>
                  <TableHead>เหตุผล</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave._id}>
                    <TableCell className="font-medium">{leave.employeeId?.firstName} {leave.employeeId?.lastName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{leave.leaveType}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(leave.startDate).toLocaleDateString('th-TH')} - {new Date(leave.endDate).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{leave.reason}</TableCell>
                    <TableCell>
                      <Badge variant={leave.status === "APPROVED" ? "default" : leave.status === "REJECTED" ? "destructive" : "secondary"}>
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {leave.status === "PENDING" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setSelectedLeave(leave); setApprovalDialogOpen(true); }}
                          className="text-primary"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> พิจารณา
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {leaves.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                      ไม่พบข้อมูลการลา
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>สร้างใบลาพัก / ลาป่วย</DialogTitle>
              <DialogDescription>กรอกรายละเอียดการขอลาของแต่ละบุคคล</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>เลือกบุคลากร</Label>
                <Select value={formData.employeeId} onValueChange={(v: string | null) => setFormData({...formData, employeeId: v || ""})}>
                  <SelectTrigger><SelectValue placeholder="เลือกพนักงาน..." /></SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>ประเภทการลา</Label>
                <Select value={formData.leaveType} onValueChange={(v: string | null) => setFormData({...formData, leaveType: v || "ANNUAL"})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANNUAL">ลาพักผ่อนประจำปี</SelectItem>
                    <SelectItem value="SICK">ลาป่วย</SelectItem>
                    <SelectItem value="CASUAL">ลากิจ</SelectItem>
                    <SelectItem value="MATERNITY">ลาคลอด</SelectItem>
                    <SelectItem value="OTHER">อื่นๆ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>ตั้งแต่วันที่</Label>
                  <Input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>ถึงวันที่</Label>
                  <Input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>เหตุผลการลา</Label>
                <Textarea value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ส่งคำขอลา
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>พิจารณาคำขอลา</DialogTitle>
            <DialogDescription>
              การลาของ {selectedLeave?.employeeId?.firstName} {selectedLeave?.employeeId?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 font-normal">
            <div className="grid grid-cols-2 text-sm gap-2">
              <span className="text-muted-foreground">ประเภท:</span> <span>{selectedLeave?.leaveType}</span>
              <span className="text-muted-foreground">เหตุผล:</span> <span>{selectedLeave?.reason}</span>
            </div>
            <div className="grid gap-2">
              <Label>คำสั่งการ / ข้อความเพิ่มเติม</Label>
              <Textarea value={approvalData.comment} onChange={(e) => setApprovalData({...approvalData, comment: e.target.value})} />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="destructive" className="flex-1 gap-2" onClick={() => { setApprovalData({...approvalData, status: "REJECTED"}); handleApproval(); }}>
              <XCircle className="h-4 w-4" /> ไม่อนุมัติ
            </Button>
            <Button variant="default" className="flex-1 gap-2 bg-green-600 hover:bg-green-700 font-bold" onClick={() => { setApprovalData({...approvalData, status: "APPROVED"}); handleApproval(); }}>
              <CheckCircle className="h-4 w-4" /> อนุมัติ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

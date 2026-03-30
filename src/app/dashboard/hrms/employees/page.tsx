"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, Pencil, Trash2, Search, UserCircle } from "lucide-react"

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<any>(null)
  const [empToDelete, setEmpToDelete] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState("")

  // Form State
  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    departmentId: "",
    position: "",
    status: "ACTIVE",
    joinDate: new Date().toISOString().split('T')[0],
    salary: 0
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [empRes, depRes] = await Promise.all([
        fetch("/api/hrms/employees"),
        fetch("/api/hrms/departments")
      ])
      const empData = await empRes.json()
      const depData = await depRes.json()
      setEmployees(Array.isArray(empData) ? empData : [])
      setDepartments(Array.isArray(depData) ? depData : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const resetForm = () => {
    setFormData({
      employeeId: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      departmentId: "",
      position: "",
      status: "ACTIVE",
      joinDate: new Date().toISOString().split('T')[0],
      salary: 0
    })
    setEditingEmployee(null)
    setError("")
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (emp: any) => {
    setEditingEmployee(emp)
    setFormData({
      employeeId: emp.employeeId,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phoneNumber: emp.phoneNumber || "",
      departmentId: emp.departmentId?._id || emp.departmentId || "",
      position: emp.position,
      status: emp.status,
      joinDate: emp.joinDate ? new Date(emp.joinDate).toISOString().split('T')[0] : "",
      salary: emp.salary || 0
    })
    setError("")
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const method = editingEmployee ? "PUT" : "POST"
      const url = editingEmployee ? `/api/hrms/employees/${editingEmployee._id}` : "/api/hrms/employees"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to save employee")

      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!empToDelete) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/hrms/employees/${empToDelete._id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete employee")
      setDeleteDialogOpen(false)
      setEmpToDelete(null)
      fetchData()
    } catch (err: any) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredEmployees = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName} ${emp.employeeId} ${emp.position}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ทะเบียนประวัติบุคลากร</h2>
          <p className="text-muted-foreground">จัดการข้อมูลพนักงานและรายละเอียดตำแหน่งงาน</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> เพิ่มพนักงาน
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อ, รหัส หรือตำแหน่ง..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>รายชื่อพนักงานทั้งหมด</CardTitle>
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
                  <TableHead>รหัสพนักงาน</TableHead>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead>กอง / สำนัก</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp) => (
                  <TableRow key={emp._id}>
                    <TableCell className="font-mono text-xs">{emp.employeeId}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                        {emp.firstName} {emp.lastName}
                      </div>
                    </TableCell>
                    <TableCell>{emp.departmentId?.name || "-"}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>
                      <Badge variant={emp.status === "ACTIVE" ? "default" : emp.status === "TERMINATED" ? "destructive" : "secondary"}>
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(emp)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => { setEmpToDelete(emp); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                      ไม่พบข้อมูลพนักงาน
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingEmployee ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}</DialogTitle>
              <DialogDescription>กรอกรายละเอียดข้อมูลส่วนบุคคลและข้อมูลการทำงาน</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error && (
                <div className="bg-destructive/15 text-destructive text-xs p-2 rounded border border-destructive/20">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="employeeId">รหัสพนักงาน</Label>
                  <Input id="employeeId" value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} placeholder="เช่น EMP001" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">สถานะ</Label>
                  <Select value={formData.status} onValueChange={(v: string | null) => setFormData({...formData, status: v || "ACTIVE"})}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ปฏิบัติงาน (Active)</SelectItem>
                      <SelectItem value="INACTIVE">พักงาน (Inactive)</SelectItem>
                      <SelectItem value="LEAVE">ลาพัก (Leave)</SelectItem>
                      <SelectItem value="TERMINATED">พ้นสภาพ (Terminated)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">ชื่อ</Label>
                  <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">นามสกุล</Label>
                  <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phoneNumber">เบอร์โทรศัพท์</Label>
                  <Input id="phoneNumber" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="department">กอง / สำนัก</Label>
                  <Select value={formData.departmentId} onValueChange={(v: string | null) => setFormData({...formData, departmentId: v || ""})}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกกอง" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dep) => (
                        <SelectItem key={dep._id} value={dep._id}>{dep.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="position">ตำแหน่ง</Label>
                  <Input id="position" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="joinDate">วันที่เริ่มงาน</Label>
                  <Input id="joinDate" type="date" value={formData.joinDate} onChange={(e) => setFormData({...formData, joinDate: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="salary">เงินเดือน (บาท)</Label>
                  <Input id="salary" type="number" value={formData.salary} onChange={(e) => setFormData({...formData, salary: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>ยกเลิก</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingEmployee ? "บันทึกการแก้ไข" : "เพิ่มพนักงาน"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบข้อมูลบุคลากร</DialogTitle>
            <DialogDescription>
              คุณต้องการลบข้อมูลของ {empToDelete?.firstName} {empToDelete?.lastName} ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ลบข้อมูล
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

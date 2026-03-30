"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, Pencil, Trash2, Building2 } from "lucide-react"

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<any>(null)
  const [deptToDelete, setDeptToDelete] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    managerId: ""
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [depRes, userRes] = await Promise.all([
        fetch("/api/hrms/departments"),
        fetch("/api/members") // Assuming there's a members/users API
      ])
      const depData = await depRes.json()
      const userData = await userRes.json()
      setDepartments(Array.isArray(depData) ? depData : [])
      setUsers(Array.isArray(userData) ? userData : [])
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
      name: "",
      description: "",
      managerId: ""
    })
    setEditingDept(null)
    setError("")
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (dept: any) => {
    setEditingDept(dept)
    setFormData({
      name: dept.name,
      description: dept.description || "",
      managerId: dept.managerId?._id || dept.managerId || ""
    })
    setError("")
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const method = editingDept ? "PUT" : "POST"
      const url = editingDept ? `/api/hrms/departments/${editingDept._id}` : "/api/hrms/departments"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to save department")

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
    if (!deptToDelete) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/hrms/departments/${deptToDelete._id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to delete department")
      
      setDeleteDialogOpen(false)
      setDeptToDelete(null)
      fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">จัดการกอง / สำนัก</h2>
          <p className="text-muted-foreground">กำหนดโครงสร้างหน่วยงานภายในองค์กร</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> เพิ่มหน่วยงาน
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายชื่อหน่วยงานทั้งหมด</CardTitle>
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
                  <TableHead>ชื่อหน่วยงาน</TableHead>
                  <TableHead>รายละเอียด / หน้าที่รับผิดชอบ</TableHead>
                  <TableHead>หัวหน้าหน่วยงาน</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {dept.name}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{dept.description || "-"}</TableCell>
                    <TableCell>{dept.managerId?.name || "ยังไม่มีการมอบหมาย"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(dept)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => { setDeptToDelete(dept); setDeleteDialogOpen(true); setError(""); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {departments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                      ยังไม่มีข้อมูลหน่วยงาน
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
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingDept ? "แก้ไขข้อมูลหน่วยงาน" : "เพิ่มหน่วยงานใหม่"}</DialogTitle>
              <DialogDescription>ระบุชื่อหน่วยงานและคำอธิบายเบื้องต้น</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error && (
                <div className="bg-destructive/15 text-destructive text-xs p-2 rounded border border-destructive/20">
                  {error}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="name">ชื่อหน่วยงาน (กอง / สำนัก)</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="เช่น กองช่าง, สำนักปลัด" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">รายละเอียด / หน้าที่รับผิดชอบ</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="อธิบายงานเบื้องต้น..." rows={3} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manager">หัวหน้าหน่วยงาน</Label>
                <Select value={formData.managerId} onValueChange={(v: string | null) => setFormData({...formData, managerId: v || ""})}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหัวหน้าหน่วยงาน" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">--- ไม่ระบุ ---</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>{user.name} ({user.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>ยกเลิก</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingDept ? "บันทึกการแก้ไข" : "เพิ่มหน่วยงาน"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบหน่วยงาน</DialogTitle>
            <DialogDescription>
              คุณต้องการลบกอง "{deptToDelete?.name}" ใช่หรือไม่?
              {error && <p className="mt-2 text-destructive text-sm font-medium">{error}</p>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ลบหน่วยงาน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

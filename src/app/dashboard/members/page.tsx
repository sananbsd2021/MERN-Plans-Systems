"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, Pencil, Trash2, UserCheck, UserX } from "lucide-react"

const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "POLICY_ANALYST", label: "Policy Analyst" },
  { value: "OFFICER", label: "Officer" },
  { value: "EXECUTIVE", label: "Executive" },
]

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("OFFICER")

  const fetchMembers = useCallback(() => {
    setLoading(true)
    fetch("/api/members")
      .then((res) => {
        if (!res.ok) return []
        return res.json()
      })
      .then((data) => {
        setMembers(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const resetForm = () => {
    setName("")
    setEmail("")
    setPassword("")
    setRole("OFFICER")
    setEditingMember(null)
    setError("")
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (member: any) => {
    setEditingMember(member)
    setName(member.name)
    setEmail(member.email)
    setRole(member.role)
    setPassword("")
    setError("")
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      if (editingMember) {
        // Update
        const payload: any = { name, email, role }
        if (password) payload.password = password

        const res = await fetch(`/api/members/${editingMember._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || "Failed to update")
      } else {
        // Create
        const res = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || "Failed to create")
      }

      setDialogOpen(false)
      resetForm()
      fetchMembers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (member: any) => {
    if (member.isActive) {
      // Deactivate
      const res = await fetch(`/api/members/${member._id}`, { method: "DELETE" })
      if (res.ok) fetchMembers()
    } else {
      // Reactivate
      const res = await fetch(`/api/members/${member._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      })
      if (res.ok) fetchMembers()
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">ระบบสมาชิก</h2>
        <button
          onClick={openCreateDialog}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> เพิ่มสมาชิก
        </button>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingMember ? "แก้ไขสมาชิก" : "เพิ่มสมาชิกใหม่"}</DialogTitle>
                <DialogDescription>
                  {editingMember ? "แก้ไขข้อมูลสมาชิกและกดบันทึก" : "กรอกข้อมูลสมาชิกใหม่และกดบันทึก"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {error && (
                  <div className="bg-destructive/15 text-destructive text-xs p-2 rounded border border-destructive/20">
                    {error}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="สมชาย ใจดี" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">
                    รหัสผ่าน {editingMember && <span className="text-muted-foreground text-xs">(เว้นว่างหากไม่เปลี่ยน)</span>}
                  </Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required={!editingMember} minLength={6} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">บทบาท</Label>
                  <Select value={role} onValueChange={(v: string | null) => setRole(v || "OFFICER")}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกบทบาท" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingMember ? "บันทึก" : "เพิ่มสมาชิก"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายชื่อสมาชิก</CardTitle>
          <CardDescription>จัดการสมาชิกในองค์กรของท่าน กำหนดบทบาทและสิทธิ์การเข้าถึง</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>บทบาท</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>สมัครเมื่อ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member._id} className={!member.isActive ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {member.isActive ? (
                        <Badge variant="default" className="gap-1 bg-emerald-600">
                          <UserCheck className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <UserX className="h-3 w-3" /> Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString("th-TH")}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(member)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(member)}
                        className={member.isActive ? "text-destructive hover:text-destructive" : "text-emerald-600 hover:text-emerald-600"}
                      >
                        {member.isActive ? <Trash2 className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      ยังไม่มีสมาชิก กดปุ่ม &quot;เพิ่มสมาชิก&quot; เพื่อเริ่มต้น
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

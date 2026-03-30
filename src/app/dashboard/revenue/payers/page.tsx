"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, Pencil, Trash2, Search, UserPlus } from "lucide-react"

export default function PayersPage() {
  const [payers, setPayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPayer, setEditingPayer] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    taxId: "",
    address: "",
    phoneNumber: ""
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/revenue/payers")
      const data = await res.json()
      setPayers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredPayers = payers.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.taxId.includes(search)
  )

  const resetForm = () => {
    setFormData({ name: "", taxId: "", address: "", phoneNumber: "" })
    setEditingPayer(null)
    setError("")
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (payer: any) => {
    setEditingPayer(payer)
    setFormData({
      name: payer.name,
      taxId: payer.taxId,
      address: payer.address || "",
      phoneNumber: payer.phoneNumber || ""
    })
    setError("")
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const method = editingPayer ? "PUT" : "POST"
      const url = editingPayer ? `/api/revenue/payers/${editingPayer._id}` : "/api/revenue/payers"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to save taxpayer")

      setDialogOpen(false)
      resetForm()
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
          <h2 className="text-3xl font-bold tracking-tight">ทะเบียนผู้เสียภาษี</h2>
          <p className="text-muted-foreground">จัดการรายชื่อประชาชนและนิติบุคคลที่มีหน้าที่เสียภาษี</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4" /> เพิ่มผู้เสียภาษีรายใหม่
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="ค้นหาด้วยชื่อ หรือ เลขประจำตัวผู้เสียภาษี..." 
            className="pl-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายชื่อผู้เสียภาษีทั้งหมด</CardTitle>
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
                  <TableHead>ลำดับ</TableHead>
                  <TableHead>ชื่อ-นามสกุล / นิติบุคคล</TableHead>
                  <TableHead>เลขประจำตัว (PID/TAX)</TableHead>
                  <TableHead>เบอร์โทรศัพท์</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayers.map((payer, idx) => (
                  <TableRow key={payer._id}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{payer.name}</TableCell>
                    <TableCell>{payer.taxId}</TableCell>
                    <TableCell>{payer.phoneNumber || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(payer)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPayers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                      ไม่พบข้อมูลผู้เสียภาษี
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingPayer ? "แก้ไขข้อมูลผู้เสียภาษี" : "เพิ่มผู้เสียภาษีรายใหม่"}</DialogTitle>
              <DialogDescription>บันทึกรายละเอียดเพื่อใช้ในระบบการประเมินรายได้</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="grid gap-2">
                <Label htmlFor="name">ชื่อ-นามสกุล / ชื่อกิจการ</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="taxId">เลขประจำตัวประชาชน / ทะเบียนพาณิชย์</Label>
                <Input id="taxId" value={formData.taxId} onChange={(e) => setFormData({...formData, taxId: e.target.value})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">เบอร์โทรศัพท์ติดต่อ</Label>
                <Input id="phone" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">ที่อยู่ / สถานที่ประกอบการ</Label>
                <Textarea id="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>ยกเลิก</Button>
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                บันทึกข้อมูล
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

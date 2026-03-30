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
import { Plus, Loader2, Pencil, Trash2, Search, Building, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function InventoryPage() {
  const [assets, setAssets] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    assetCode: "",
    name: "",
    categoryId: "",
    departmentId: "",
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    status: "ACTIVE",
    serialNumber: "",
    specification: "",
    sourceOfFunds: ""
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [aRes, cRes, dRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/assets/categories?type=ASSET"),
        fetch("/api/hrms/departments")
      ])
      const aData = await aRes.json()
      const cData = await cRes.json()
      const dData = await dRes.json()
      setAssets(Array.isArray(aData) ? aData : [])
      setCategories(Array.isArray(cData) ? cData : [])
      setDepartments(Array.isArray(dData) ? dData : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredAssets = assets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.assetCode.includes(search) ||
    a.serialNumber?.toLowerCase().includes(search.toLowerCase())
  )

  const resetForm = () => {
    setFormData({
      assetCode: "",
      name: "",
      categoryId: "",
      departmentId: "",
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: 0,
      status: "ACTIVE",
      serialNumber: "",
      specification: "",
      sourceOfFunds: ""
    })
    setEditingAsset(null)
    setError("")
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (asset: any) => {
    setEditingAsset(asset)
    setFormData({
      assetCode: asset.assetCode,
      name: asset.name,
      categoryId: asset.categoryId?._id || asset.categoryId,
      departmentId: asset.departmentId?._id || asset.departmentId,
      purchaseDate: new Date(asset.purchaseDate).toISOString().split('T')[0],
      purchasePrice: asset.purchasePrice,
      status: asset.status,
      serialNumber: asset.serialNumber || "",
      specification: asset.specification || "",
      sourceOfFunds: asset.sourceOfFunds || ""
    })
    setError("")
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch(`/api/assets/${deleteId}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to delete asset")

      setDeleteDialogOpen(false)
      setDeleteId(null)
      fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const openDeleteConfirm = (id: string) => {
    setDeleteId(id)
    setDeleteDialogOpen(true)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const method = editingAsset ? "PUT" : "POST"
      const url = editingAsset ? `/api/assets/${editingAsset._id}` : "/api/assets"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to save asset")

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
          <h2 className="text-3xl font-bold tracking-tight">ทะเบียนครุภัณฑ์</h2>
          <p className="text-muted-foreground">รายการทรัพย์สินและครุภัณฑ์ทั้งหมดของหน่วยงาน</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4" /> เพิ่มครุภัณฑ์รายใหม่
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาด้วยชื่อครุภัณฑ์ เลขรหัส หรือ Serial..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

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
                  <TableHead>รหัสครุภัณฑ์ / ชื่อ</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>แผนกที่รับผิดชอบ</TableHead>
                  <TableHead className="text-right">ราคาทุน</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-blue-700">{asset.assetCode}</span>
                        <span className="font-medium">{asset.name}</span>
                        {asset.serialNumber && <span className="text-[10px] text-muted-foreground font-mono">S/N: {asset.serialNumber}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal italic">
                        {asset.categoryId?.name || "ไม่ระบุ"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        {asset.departmentId?.name || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ฿{asset.purchasePrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={asset.status === 'ACTIVE' ? 'default' : 'destructive'} className={asset.status === 'ACTIVE' ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(asset)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => openDeleteConfirm(asset._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAssets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">ไม่พบข้อมูลครุภัณฑ์</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingAsset ? "แก้ไขข้อมูลครุภัณฑ์" : "ลงทะเบียนครุภัณฑ์ใหม่"}</DialogTitle>
              <DialogDescription>บันทึกรายละเอียดทรัพย์สินและกำหนดหน่วยงานที่รับผิดชอบ</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              {error && !deleteDialogOpen && <div className="sm:col-span-2 text-red-500 text-sm p-2 bg-red-50 rounded border border-red-100">{error}</div>}

              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="assetCode">รหัสครุภัณฑ์ (Asset Code)</Label>
                <Input id="assetCode" value={formData.assetCode} onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })} placeholder="เช่น 7440-001-0001" required />
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="name">ชื่อครุภัณฑ์</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="เช่น เครื่องคอมพิวเตอร์แบบตั้งโต๊ะ" required />
              </div>

              <div className="grid gap-2">
                <Label>หมวดหมู่</Label>
                <Select value={formData.categoryId || ""} onValueChange={(v: string | null) => v && setFormData({ ...formData, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.name} ({c.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>แผนกที่รับผิดชอบสวัสดิการ</Label>
                <Select value={formData.departmentId || ""} onValueChange={(v: string | null) => v && setFormData({ ...formData, departmentId: v })}>
                  <SelectTrigger><SelectValue placeholder="เลือกหน่วยงาน" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="purchaseDate">วันที่ได้รับ / ตรวจรับ</Label>
                <Input id="purchaseDate" type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="purchasePrice">มูลค่า (ราคาทุน)</Label>
                <Input id="purchasePrice" type="number" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })} required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="serialNumber">S/N / เลขที่เครื่อง</Label>
                <Input id="serialNumber" value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} />
              </div>

              <div className="grid gap-2">
                <Label>สถานะการใช้งาน</Label>
                <Select value={formData.status || ""} onValueChange={(v: string | null) => v && setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ปกติ (Active)</SelectItem>
                    <SelectItem value="BROKEN">ชำรุด (Broken)</SelectItem>
                    <SelectItem value="LOST">สูญหาย (Lost)</SelectItem>
                    <SelectItem value="DISPOSED">จำหน่ายออก (Disposed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="specification">คุณลักษณะ / สเปคเพิ่มเติม</Label>
                <Textarea id="specification" value={formData.specification} onChange={(e) => setFormData({ ...formData, specification: e.target.value })} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>ยกเลิก</Button>
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAsset ? "บันทึกการแก้ไข" : "ลงทะเบียนครุภัณฑ์"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> ยืนยันการลบข้อมูล
            </DialogTitle>
            <DialogDescription>
              คุณตรวจสอบแน่ใจแล้วหรือไม่ที่จะลบรายการครุภัณฑ์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-100">{error}</div>}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ยืนยันการลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

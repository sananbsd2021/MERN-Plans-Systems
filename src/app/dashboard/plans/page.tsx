"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, Pencil, Trash2, FileText, Eye, Upload } from "lucide-react"
import { PDFViewer } from "@/components/shared/pdf-viewer"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<any>(null)
  const [planToDelete, setPlanToDelete] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [currentPdfUrl, setCurrentPdfUrl] = useState("")
  const [viewingPdfUrl, setViewingPdfUrl] = useState("")

  // Form State
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState("DRAFT")
  const [pdfUrl, setPdfUrl] = useState("")

  const fetchPlans = useCallback(() => {
    setLoading(true)
    fetch("/api/plans")
      .then((res) => {
        if (!res.ok) return []
        return res.json()
      })
      .then((data) => {
        setPlans(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setStartDate("")
    setEndDate("")
    setStatus("DRAFT")
    setPdfUrl("")
    setEditingPlan(null)
    setError("")
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (plan: any) => {
    setEditingPlan(plan)
    setTitle(plan.title)
    setDescription(plan.description || "")
    setStartDate(plan.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : "")
    setEndDate(plan.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : "")
    setStatus(plan.status)
    setPdfUrl(plan.pdfUrl || "")
    setError("")
    setDialogOpen(true)
  }

  const openDeleteDialog = (plan: any) => {
    setPlanToDelete(plan)
    setDeleteDialogOpen(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError("")
    
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Upload failed")
      setPdfUrl(data.url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const payload = { title, description, startDate, endDate, status, pdfUrl }

      if (editingPlan) {
        const res = await fetch(`/api/plans/${editingPlan._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || "Failed to update plan")
      } else {
        const res = await fetch("/api/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || "Failed to create plan")
      }

      setDialogOpen(false)
      resetForm()
      fetchPlans()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!planToDelete) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/plans/${planToDelete._id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete plan")
      setDeleteDialogOpen(false)
      setPlanToDelete(null)
      fetchPlans()
    } catch (err: any) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">แผนยุทธศาสตร์ (Strategic Plans)</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const columns = ["หัวข้อแผน", "สถานะ", "ระยะเวลา", "เวอร์ชัน"];
              const data = plans.map(p => [
                p.title,
                p.status,
                `${new Date(p.startDate).getFullYear()} - ${new Date(p.endDate).getFullYear()}`,
                `v${p.version}`
              ]);
              import("@/lib/utils/reports").then(m => m.exportToPDF("รายงานแผนยุทธศาสตร์", columns, data, "strategic-plans"));
            }}
            className="gap-2"
          >
            Export PDF
          </Button>
          <button
            onClick={openCreateDialog}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> เพิ่มแผนยุทธศาสตร์
          </button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingPlan ? "แก้ไขแผนยุทธศาสตร์" : "สร้างแผนยุทธศาสตร์ใหม่"}</DialogTitle>
              <DialogDescription>
                กรอกข้อมูลแผนยุทธศาสตร์และกำหนดระยะเวลา
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error && (
                <div className="bg-destructive/15 text-destructive text-xs p-2 rounded border border-destructive/20">
                  {error}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="title">ชื่อแผนยุทธศาสตร์</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น แผนพัฒนาท้องถิ่น (พ.ศ. 2566-2570)" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">รายละเอียด</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="อธิบายวัตถุประสงค์ของแผน..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
                  <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
                  <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </div>
              </div>
              {editingPlan && (
                <div className="grid gap-2">
                  <Label htmlFor="status">สถานะ</Label>
                  <Select value={status} onValueChange={(v: string | null) => setStatus(v || "DRAFT")}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">DRAFT (ร่าง)</SelectItem>
                      <SelectItem value="PENDING_APPROVAL">PENDING APPROVAL (รออนุมัติ)</SelectItem>
                      <SelectItem value="APPROVED">APPROVED (อนุมัติแล้ว)</SelectItem>
                      <SelectItem value="REJECTED">REJECTED (ไม่อนุมัติ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="pdf">เอกสารแผนพัฒนา (PDF)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input id="pdf-file" type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                    <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => document.getElementById('pdf-file')?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {pdfUrl ? "เปลี่ยนไฟล์เอกสาร" : "อัปโหลดไฟล์ PDF"}
                    </Button>
                  </div>
                  {pdfUrl && (
                    <Button type="button" variant="ghost" className="text-primary px-2" onClick={() => window.open(pdfUrl, '_blank')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {pdfUrl && <p className="text-[10px] text-muted-foreground truncate italic">ไฟล์ปัจจุบัน: {pdfUrl.split('/').pop()}</p>}
              </div>
            </div>
            <DialogFooter>
              <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingPlan ? "บันทึก" : "สร้างแผน"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบแผนยุทธศาสตร์</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบแผน "{planToDelete?.title}"? การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ลบแผน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PDFViewer 
        url={viewingPdfUrl} 
        isOpen={pdfDialogOpen} 
        onClose={() => setPdfDialogOpen(false)} 
        title={`แผนยุทธศาสตร์: ${editingPlan?.title || "เอกสาร"}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Organization Strategic Plans</CardTitle>
          <CardDescription>
            Manage and monitor your organization's long-term strategic plans and versioning.
          </CardDescription>
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
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan._id}>
                    <TableCell className="font-medium">{plan.title}</TableCell>
                    <TableCell>
                      <Badge variant={plan.status === "APPROVED" ? "default" : plan.status === "DRAFT" ? "outline" : "secondary"}>
                        {plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(plan.startDate).getFullYear()} - {new Date(plan.endDate).getFullYear()}
                    </TableCell>
                    <TableCell>v{plan.version}</TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Link 
                        href={`/dashboard/plans/${plan._id}`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                        title="ดูรายละเอียด"
                      >
                        <Eye className="h-4 w-4 text-primary" />
                      </Link>
                      {plan.pdfUrl && (
                        <Button variant="ghost" size="sm" onClick={() => { setViewingPdfUrl(plan.pdfUrl); setPdfDialogOpen(true); }} title="ดูเอกสารแนบ">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(plan)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog(plan)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {plans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No strategic plans found. Create one to get started.
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

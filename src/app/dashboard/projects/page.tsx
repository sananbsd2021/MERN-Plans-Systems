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
import { Plus, Loader2, Pencil, Trash2, MapPin, Eye, Upload, LayoutList, GanttChartSquare } from "lucide-react"
import { PDFViewer } from "@/components/shared/pdf-viewer"
import { ProjectTimeline } from "@/components/projects/project-timeline"
import { cn } from "@/lib/utils"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table")
  
  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [viewingPdfUrl, setViewingPdfUrl] = useState("")
  
  // Form State
  const [editingProject, setEditingProject] = useState<any>(null)
  const [projectToDelete, setProjectToDelete] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  
  // Form Fields
  const [planId, setPlanId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState("PLANNED")
  const [budgetAllocated, setBudgetAllocated] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [pdfUrl, setPdfUrl] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [projRes, planRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/plans")
      ])
      
      if (projRes.ok) {
        const pData = await projRes.json()
        setProjects(Array.isArray(pData) ? pData : [])
      }
      
      if (planRes.ok) {
        const pData = await planRes.json()
        setPlans(Array.isArray(pData) ? pData : [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const resetForm = () => {
    setPlanId("")
    setName("")
    setDescription("")
    setStartDate("")
    setEndDate("")
    setStatus("PLANNED")
    setBudgetAllocated("")
    setLat("")
    setLng("")
    setPdfUrl("")
    setEditingProject(null)
    setError("")
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (project: any) => {
    setEditingProject(project)
    setPlanId(project.planId?._id || project.planId)
    setName(project.name)
    setDescription(project.description || "")
    setStartDate(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "")
    setEndDate(project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "")
    setStatus(project.status)
    setBudgetAllocated(project.budgetAllocated?.toString() || "")
    if (project.location && project.location.coordinates?.length === 2) {
      setLng(project.location.coordinates[0].toString())
      setLat(project.location.coordinates[1].toString())
    } else {
      setLat("")
      setLng("")
    }
    setPdfUrl(project.pdfUrl || "")
    setError("")
    setDialogOpen(true)
  }

  const openDeleteDialog = (project: any) => {
    setProjectToDelete(project)
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
      const payload: any = { 
        planId, 
        name, 
        description, 
        startDate, 
        endDate, 
        status, 
        budgetAllocated: parseFloat(budgetAllocated),
        pdfUrl
      }

      if (lat && lng) {
        payload.location = {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)]
        }
      } else if (editingProject) {
        payload.location = null
      }

      const method = editingProject ? "PUT" : "POST"
      const url = editingProject ? `/api/projects/${editingProject._id}` : "/api/projects"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) throw new Error((await res.json()).message || "Operation failed")

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
    if (!projectToDelete) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectToDelete._id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete project")
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
      fetchData()
    } catch (err: any) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-bold tracking-tight">โครงการ (Projects)</h2>
           <p className="text-muted-foreground text-sm mt-1">จัดการและติดตามความก้าวหน้าโครงการพัฒนาท้องถิ่น</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 bg-muted rounded-lg border shadow-inner">
            <button
               onClick={() => setViewMode("table")}
               className={cn(
                 "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                 viewMode === "table" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
               )}
            >
              <LayoutList className="h-3.5 w-3.5" /> รายการ
            </button>
            <button
               onClick={() => setViewMode("timeline")}
               className={cn(
                 "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                 viewMode === "timeline" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
               )}
            >
              <GanttChartSquare className="h-3.5 w-3.5" /> ไทม์ไลน์
            </button>
          </div>
          <button
            onClick={openCreateDialog}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> เพิ่มโครงการ
          </button>
        </div>
      </div>

      {viewMode === "timeline" ? (
        <ProjectTimeline projects={projects} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>โครงการขององค์กร</CardTitle>
            <CardDescription>
              ติดตามความคืบหน้า, งบประมาณ, และพิกัดสถานที่ของโครงการ
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
                    <TableHead>ชื่อโครงการ</TableHead>
                    <TableHead>แผนยุทธศาสตร์</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>งบประมาณ</TableHead>
                    <TableHead>พิกัด</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project._id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell className="text-muted-foreground">{project.planId?.title || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={project.status === "COMPLETED" ? "default" : project.status === "IN_PROGRESS" ? "secondary" : "outline"}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>฿{project.budgetAllocated?.toLocaleString()}</TableCell>
                      <TableCell>
                        {project.location ? (
                          <Badge variant="secondary" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
                            <MapPin className="h-3 w-3" /> ระบุแล้ว
                          </Badge>
                        ) : <span className="text-xs text-muted-foreground">ไม่มี</span>}
                      </TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        {project.pdfUrl && (
                          <Button variant="ghost" size="sm" onClick={() => { setViewingPdfUrl(project.pdfUrl); setPdfDialogOpen(true); }}>
                            <Eye className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(project)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog(project)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {projects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        ยังไม่มีข้อมูลโครงการ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Forms & Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingProject ? "แก้ไขโครงการ" : "สร้างโครงการใหม่"}</DialogTitle>
              <DialogDescription>เชื่อมโยงโครงการกับแผนยุทธศาสตร์และระบุข้อมูลเบื้องต้น</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error && <div className="bg-destructive/15 text-destructive text-xs p-2 rounded">{error}</div>}
              <div className="grid gap-2">
                <Label htmlFor="planId">ภายใต้แผนยุทธศาสตร์</Label>
                <Select value={planId} onValueChange={(v) => setPlanId(v || "")}>
                  <SelectTrigger id="planId"><SelectValue placeholder="เลือกแผนยุทธศาสตร์" /></SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">ชื่อโครงการ</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ระบุชื่อโครงการ" required />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="budgetAllocated">งบประมาณ (บาท)</Label>
                  <Input id="budgetAllocated" type="number" step="0.01" value={budgetAllocated} onChange={(e) => setBudgetAllocated(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">สถานะ</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v || "PLANNED")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNED">PLANNED</SelectItem>
                      <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                      <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                      <SelectItem value="ON_HOLD">ON_HOLD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>ละติจูด (Lat)</Label><Input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} /></div>
                <div className="grid gap-2"><Label>ลองจิจูด (Lng)</Label><Input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} /></div>
              </div>
              <div className="grid gap-2">
                <Label>เอกสารโครงการ (PDF)</Label>
                <div className="flex gap-2">
                   <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('file-up')?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="mr-2 animate-spin" /> : <Upload className="mr-2" />}
                      {pdfUrl ? "เปลี่ยนไฟล์" : "เลือกไฟล์ PDF"}
                   </Button>
                   <input id="file-up" type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                </div>
              </div>
            </div>
            <DialogFooter>
               <Button type="submit" disabled={submitting || !planId}>
                  {submitting && <Loader2 className="mr-2 animate-spin" />}
                  {editingProject ? "บันทึก" : "สร้างโครงการ"}
               </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>ลบโครงการ</DialogTitle></DialogHeader>
          <p className="text-sm py-4">คุณแน่ใจหรือไม่ว่าต้องการลบโครงการ "{projectToDelete?.name}"?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>ลบ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PDFViewer url={viewingPdfUrl} isOpen={pdfDialogOpen} onClose={() => setPdfDialogOpen(false)} title="เอกสารโครงการ" />
    </div>
  )
}

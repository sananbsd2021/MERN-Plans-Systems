"use client"
import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Sparkles, AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react"

export default function KPIPage() {
  const [kpis, setKpis] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingKpi, setEditingKpi] = useState<any>(null)
  const [kpiToDelete, setKpiToDelete] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Form State
  const [name, setName] = useState("")
  const [projectId, setProjectId] = useState("")
  const [metric, setMetric] = useState("")
  const [targetValue, setTargetValue] = useState("")
  const [currentValue, setCurrentValue] = useState("")
  const [unit, setUnit] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [kpiRes, projRes] = await Promise.all([
        fetch("/api/kpi"),
        fetch("/api/projects")
      ])
      
      if (kpiRes.ok) {
        const data = await kpiRes.json()
        setKpis(Array.isArray(data) ? data : [])
      }
      
      if (projRes.ok) {
        const data = await projRes.json()
        setProjects(Array.isArray(data) ? data : [])
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
    setName("")
    setProjectId("")
    setMetric("")
    setTargetValue("")
    setCurrentValue("0")
    setUnit("")
    setEditingKpi(null)
    setError("")
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (kpi: any) => {
    setEditingKpi(kpi)
    setName(kpi.name)
    setProjectId(kpi.projectId?._id || kpi.projectId)
    setMetric(kpi.metric)
    setTargetValue(kpi.targetValue.toString())
    setCurrentValue(kpi.currentValue.toString())
    setUnit(kpi.unit)
    setError("")
    setDialogOpen(true)
  }

  const openDeleteDialog = (kpi: any) => {
    setKpiToDelete(kpi)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const payload = {
        name,
        projectId,
        metric,
        targetValue: parseFloat(targetValue),
        currentValue: parseFloat(currentValue),
        unit
      }

      if (editingKpi) {
        const res = await fetch(`/api/kpi/${editingKpi._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json()).message || "Failed to update KPI")
      } else {
        const res = await fetch("/api/kpi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json()).message || "Failed to create KPI")
      }

      setDialogOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!kpiToDelete) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/kpi/${kpiToDelete._id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete KPI")
      setDeleteDialogOpen(false)
      fetchData()
    } catch (err: any) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch("/api/kpi/analyze", { method: "POST" })
      if (!res.ok) throw new Error("Analysis failed")
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">ระบบจัดการตัวชี้วัด (KPI Management)</h2>
        <div className="flex items-center gap-2">
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" /> เพิ่มตัวชี้วัด
          </Button>
          <Button
            variant="outline"
            onClick={() => {
               const data = kpis.map(k => ({
                  "ตัวชี้วัด": k.name,
                  "โครงการ": k.projectId?.name || "N/A",
                  "เป้าหมาย": k.targetValue,
                  "ปัจจุบัน": k.currentValue,
                  "หน่วย": k.unit,
                  "ความคืบหน้า (%)": ((k.currentValue / k.targetValue) * 100).toFixed(2),
                  "สถานะ AI": k.aiRiskLevel || "รอการวิเคราะห์",
                  "ข้อเสนอแนะ AI": k.aiRecommendation || "-"
               }));
               import("@/lib/utils/reports").then(m => m.exportToExcel(data, "kpi-report"));
            }}
            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            Export Excel
          </Button>
          <Button onClick={handleAnalyze} disabled={analyzing} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {analyzing ? "AI กำลังวิเคราะห์..." : "วิเคราะห์ความเสี่ยงด้วย AI"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ตัวชี้วัดประสิทธิภาพหลัก (Key Performance Indicators)</CardTitle>
          <CardDescription>
            กำหนดค่าเป้าหมาย ติดตามความคืบหน้าของโครงการ และใช้ AI ช่วยวิเคราะห์แนวโน้มความสำเร็จ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ตัวชี้วัด (KPI)</TableHead>
                  <TableHead>โครงการ</TableHead>
                  <TableHead className="text-right">เป้าหมาย</TableHead>
                  <TableHead className="text-right">ปัจจุบัน</TableHead>
                  <TableHead>ความคืบหน้า</TableHead>
                  <TableHead>สถานะ (AI)</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.map((kpi) => {
                  const progress = kpi.targetValue > 0 ? (kpi.currentValue / kpi.targetValue) * 100 : 0
                  return (
                    <TableRow key={kpi._id}>
                      <TableCell>
                        <div className="font-medium">{kpi.name}</div>
                        <div className="text-[10px] text-muted-foreground">{kpi.metric}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{kpi.projectId?.name || "N/A"}</TableCell>
                      <TableCell className="text-right font-mono">{new Intl.NumberFormat("th-TH").format(kpi.targetValue)} {kpi.unit}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">{new Intl.NumberFormat("th-TH").format(kpi.currentValue)} {kpi.unit}</TableCell>
                      <TableCell className="w-[180px]">
                        <div className="space-y-1">
                          <Progress value={progress} className="h-1.5" />
                          <div className="flex justify-between text-[10px] font-mono">
                            <span>{progress.toFixed(1)}%</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {!kpi.aiRiskLevel ? (
                            <Badge variant="outline" className="text-muted-foreground text-[10px]">รอวิเคราะห์</Badge>
                        ) : kpi.aiRiskLevel === "CRITICAL" ? (
                          <Badge variant="destructive" className="gap-1 text-[10px]"><AlertTriangle className="h-3 w-3"/> วิกฤต</Badge>
                        ) : kpi.aiRiskLevel === "WARNING" ? (
                          <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 text-[10px] border-amber-200"><AlertTriangle className="h-3 w-3"/> เฝ้าระวัง</Badge>
                        ) : (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-[10px]">ปกติ</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(kpi)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog(kpi)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {kpis.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      ไม่พบข้อมูลตัวชี้วัด (KPI) ในระบบ
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
              <DialogTitle>{editingKpi ? "แก้ไขตัวชี้วัด" : "เพิ่มตัวชี้วัดใหม่"}</DialogTitle>
              <DialogDescription>
                กำหนดรายละเอียดตัวชี้วัดและค่าเป้าหมาย
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error && (
                <div className="bg-destructive/15 text-destructive text-xs p-2 rounded border border-destructive/20 text-center">
                  {error}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="projectId">โครงการ</Label>
                <Select value={projectId} onValueChange={(v: string | null) => setProjectId(v || "")}>
                  <SelectTrigger id="projectId">
                    <SelectValue placeholder="เลือกโครงการ" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">ชื่อตัวชี้วัด</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น ความพึงพอใจ, ผลผลิตรวม..." required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="metric">เกณฑ์การวัด (Metric)</Label>
                <Input id="metric" value={metric} onChange={(e) => setMetric(e.target.value)} placeholder="เช่น ร้อยละของความพึงพอใจ..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="targetValue">เป้าหมาย (Target)</Label>
                  <Input id="targetValue" type="number" step="any" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">หน่วย (Unit)</Label>
                  <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="ร้อยละ, ชุด, ลิตร..." required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currentValue" className="text-primary font-bold">ค่าปัจจุบัน (Actual Progress)</Label>
                <Input id="currentValue" type="number" step="any" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} required className="border-primary focus-visible:ring-primary" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting || !projectId}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingKpi ? "บันทึกการเปลี่ยนแปลง" : "สร้างตัวชี้วัด"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              คุณต้องการลบตัวชี้วัด "{kpiToDelete?.name}" ใช่หรือไม่? ไม่สามารถเรียกคืนข้อมูลได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>ยกเลิก</Button>
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

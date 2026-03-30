"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  FileText,
  Download,
  FileSpreadsheet,
  Loader2,
  BookOpen,
  FolderKanban,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

type Plan = { _id: string; title: string; status: string; startYear: number; endYear: number; objectives?: string[] }
type Budget = { _id: string; department: string; allocatedAmount: number; spentAmount: number; remainingAmount: number; year: number; riskLevel?: string }
type KPI = { _id: string; name: string; targetValue: number; currentValue: number; unit: string; status: string }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "ร่าง", color: "outline" },
  ACTIVE: { label: "ดำเนินการ", color: "default" },
  COMPLETED: { label: "สำเร็จ", color: "secondary" },
  ARCHIVED: { label: "จัดเก็บ", color: "outline" },
  IN_PROGRESS: { label: "กำลังดำเนินการ", color: "secondary" },
  PLANNING: { label: "วางแผน", color: "outline" },
  ON_HOLD: { label: "รอดำเนินการ", color: "outline" },
  CANCELLED: { label: "ยกเลิก", color: "destructive" },
  LOW: { label: "ต่ำ", color: "secondary" },
  MEDIUM: { label: "ปานกลาง", color: "outline" },
  HIGH: { label: "สูง", color: "destructive" },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] || { label: status, color: "outline" }
  return <Badge variant={cfg.color as any}>{cfg.label}</Badge>
}

export default function ReportsPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [kpis, setKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState({ plans: true, budgets: true, kpis: true })
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/plans").then(r => r.json()),
      fetch("/api/budget").then(r => r.json()),
      fetch("/api/kpi").then(r => r.json()),
    ]).then(([p, b, k]) => {
      setPlans(Array.isArray(p) ? p : p.plans || [])
      setBudgets(Array.isArray(b) ? b : b.budgets || [])
      setKpis(Array.isArray(k) ? k : k.kpis || [])
      setLoading({ plans: false, budgets: false, kpis: false })
    }).catch(err => {
      console.error("Failed to load report data", err)
      setLoading({ plans: false, budgets: false, kpis: false })
    })
  }, [])

  // ---------- PDF Export ----------
  const exportPlansPDF = () => {
    setExporting(true)
    try {
      const doc = new jsPDF()
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text("Strategic Plan Report", 14, 20)
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Generated: ${new Date().toLocaleDateString("th-TH")}`, 14, 28)
      autoTable(doc, {
        startY: 35,
        head: [["Title", "Status", "Start Year", "End Year"]],
        body: plans.map(p => [p.title, p.status, p.startYear, p.endYear]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
      })
      doc.save("plans-report.pdf")
    } finally {
      setExporting(false)
    }
  }

  const exportBudgetPDF = () => {
    setExporting(true)
    try {
      const doc = new jsPDF()
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text("Budget Report", 14, 20)
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Generated: ${new Date().toLocaleDateString("th-TH")}`, 14, 28)
      autoTable(doc, {
        startY: 35,
        head: [["Department", "Year", "Allocated (THB)", "Spent (THB)", "Remaining (THB)", "Risk"]],
        body: budgets.map(b => [
          b.department,
          b.year,
          b.allocatedAmount.toLocaleString(),
          b.spentAmount.toLocaleString(),
          b.remainingAmount.toLocaleString(),
          b.riskLevel || "-",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [16, 185, 129] },
      })
      doc.save("budget-report.pdf")
    } finally {
      setExporting(false)
    }
  }

  const exportKpiPDF = () => {
    setExporting(true)
    try {
      const doc = new jsPDF()
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text("KPI Report", 14, 20)
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Generated: ${new Date().toLocaleDateString("th-TH")}`, 14, 28)
      autoTable(doc, {
        startY: 35,
        head: [["KPI Name", "Target", "Current", "Unit", "Achievement %", "Status"]],
        body: kpis.map(k => [
          k.name,
          k.targetValue,
          k.currentValue,
          k.unit,
          k.targetValue > 0 ? ((k.currentValue / k.targetValue) * 100).toFixed(1) + "%" : "N/A",
          k.status,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 92, 246] },
      })
      doc.save("kpi-report.pdf")
    } finally {
      setExporting(false)
    }
  }

  // ---------- Excel Export ----------
  const exportPlansExcel = () => {
    const ws = XLSX.utils.json_to_sheet(plans.map(p => ({
      "ชื่อแผน": p.title,
      "สถานะ": p.status,
      "ปีเริ่มต้น": p.startYear,
      "ปีสิ้นสุด": p.endYear,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Strategic Plans")
    XLSX.writeFile(wb, "plans-report.xlsx")
  }

  const exportBudgetExcel = () => {
    const ws = XLSX.utils.json_to_sheet(budgets.map(b => ({
      "หน่วยงาน": b.department,
      "ปีงบประมาณ": b.year,
      "งบที่ได้รับจัดสรร (บาท)": b.allocatedAmount,
      "ใช้จ่ายแล้ว (บาท)": b.spentAmount,
      "คงเหลือ (บาท)": b.remainingAmount,
      "ระดับความเสี่ยง": b.riskLevel || "-",
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Budget")
    XLSX.writeFile(wb, "budget-report.xlsx")
  }

  const exportKpiExcel = () => {
    const ws = XLSX.utils.json_to_sheet(kpis.map(k => ({
      "ชื่อตัวชี้วัด": k.name,
      "เป้าหมาย": k.targetValue,
      "ผลการดำเนินงาน": k.currentValue,
      "หน่วย": k.unit,
      "ร้อยละความสำเร็จ": k.targetValue > 0 ? ((k.currentValue / k.targetValue) * 100).toFixed(1) : 0,
      "สถานะ": k.status,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "KPIs")
    XLSX.writeFile(wb, "kpi-report.xlsx")
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">รายงาน (Reports)</h2>
          <p className="text-muted-foreground mt-1">สร้างและส่งออกรายงานในรูปแบบ PDF และ Excel</p>
        </div>
      </div>

      <Tabs defaultValue="plans">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="plans" className="gap-2">
            <BookOpen className="h-4 w-4" />แผนยุทธศาสตร์
          </TabsTrigger>
          <TabsTrigger value="budget" className="gap-2">
            <BarChart3 className="h-4 w-4" />งบประมาณ
          </TabsTrigger>
          <TabsTrigger value="kpi" className="gap-2">
            <TrendingUp className="h-4 w-4" />ตัวชี้วัด
          </TabsTrigger>
        </TabsList>

        {/* ----- PLANS TAB ----- */}
        <TabsContent value="plans" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-blue-500" />
                  รายงานแผนยุทธศาสตร์
                </CardTitle>
                <CardDescription>แผนยุทธศาสตร์ทั้งหมดในระบบ ({plans.length} รายการ)</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportPlansPDF} disabled={exporting || plans.length === 0} className="gap-2">
                  <FileText className="h-4 w-4 text-red-500" />Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={exportPlansExcel} disabled={plans.length === 0} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading.plans ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อแผน</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-center">ปีเริ่มต้น</TableHead>
                      <TableHead className="text-center">ปีสิ้นสุด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map(p => (
                      <TableRow key={p._id}>
                        <TableCell className="font-medium">{p.title}</TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell className="text-center">{p.startYear}</TableCell>
                        <TableCell className="text-center">{p.endYear}</TableCell>
                      </TableRow>
                    ))}
                    {plans.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">ไม่พบข้อมูลแผนยุทธศาสตร์</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----- BUDGET TAB ----- */}
        <TabsContent value="budget" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                  รายงานงบประมาณ
                </CardTitle>
                <CardDescription>สรุปการจัดสรรและใช้จ่ายงบประมาณทุกกอง ({budgets.length} รายการ)</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportBudgetPDF} disabled={exporting || budgets.length === 0} className="gap-2">
                  <FileText className="h-4 w-4 text-red-500" />Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={exportBudgetExcel} disabled={budgets.length === 0} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading.budgets ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>หน่วยงาน</TableHead>
                      <TableHead className="text-center">ปีงบประมาณ</TableHead>
                      <TableHead className="text-right">จัดสรร (บาท)</TableHead>
                      <TableHead className="text-right">ใช้จ่าย (บาท)</TableHead>
                      <TableHead className="text-right">คงเหลือ (บาท)</TableHead>
                      <TableHead className="text-center">ความเสี่ยง</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets.map(b => (
                      <TableRow key={b._id}>
                        <TableCell className="font-medium">{b.department}</TableCell>
                        <TableCell className="text-center">{b.year}</TableCell>
                        <TableCell className="text-right font-mono">{b.allocatedAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{b.spentAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{b.remainingAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          {b.riskLevel ? <StatusBadge status={b.riskLevel} /> : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {budgets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">ไม่พบข้อมูลงบประมาณ</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----- KPI TAB ----- */}
        <TabsContent value="kpi" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-violet-500" />
                  รายงานตัวชี้วัด (KPI)
                </CardTitle>
                <CardDescription>สรุปผลการดำเนินงานเทียบกับเป้าหมาย ({kpis.length} ตัวชี้วัด)</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportKpiPDF} disabled={exporting || kpis.length === 0} className="gap-2">
                  <FileText className="h-4 w-4 text-red-500" />Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={exportKpiExcel} disabled={kpis.length === 0} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading.kpis ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อตัวชี้วัด</TableHead>
                      <TableHead className="text-center">เป้าหมาย</TableHead>
                      <TableHead className="text-center">ผลการดำเนินงาน</TableHead>
                      <TableHead className="text-center">หน่วย</TableHead>
                      <TableHead className="text-center">ร้อยละสำเร็จ</TableHead>
                      <TableHead className="text-center">สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpis.map(k => {
                      const pct = k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0
                      const isCritical = pct < 70
                      return (
                        <TableRow key={k._id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {isCritical
                                ? <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                                : <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                              }
                              {k.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono">{k.targetValue.toLocaleString()}</TableCell>
                          <TableCell className="text-center font-mono">{k.currentValue.toLocaleString()}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{k.unit}</TableCell>
                          <TableCell className="text-center">
                            <span className={`font-bold ${isCritical ? "text-destructive" : "text-emerald-600"}`}>
                              {pct.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center"><StatusBadge status={k.status} /></TableCell>
                        </TableRow>
                      )
                    })}
                    {kpis.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">ไม่พบข้อมูลตัวชี้วัด</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

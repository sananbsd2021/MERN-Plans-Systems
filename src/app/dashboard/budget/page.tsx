"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, AlertCircle, TrendingUp, DollarSign, Wallet, Pencil, Trash2, Sparkles, History, FileText, Target } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [orgBudgetDialogOpen, setOrgBudgetDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<any>(null)
  const [budgetToDelete, setBudgetToDelete] = useState<any>(null)
  const [selectedBudgetForHistory, setSelectedBudgetForHistory] = useState<any>(null)
  const [budgetHistory, setBudgetHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Master Budget State
  const [orgBudget, setOrgBudget] = useState<{ year: number; totalAmount: number }>({ year: new Date().getFullYear(), totalAmount: 0 })
  const [newOrgAmount, setNewOrgAmount] = useState("")
  
  // Form State
  const [projectId, setProjectId] = useState("")
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [department, setDepartment] = useState("")
  const [allocatedAmount, setAllocatedAmount] = useState("")
  const [spentAmount, setSpentAmount] = useState("0")
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const currentYear = new Date().getFullYear()
      const [budgetsRes, projectsRes, orgBudgetRes] = await Promise.all([
        fetch("/api/budget"),
        fetch("/api/projects"),
        fetch(`/api/budget/org?year=${currentYear}`)
      ])
      
      if (budgetsRes.ok) {
        const b = await budgetsRes.json()
        setBudgets(Array.isArray(b) ? b : [])
      }
      
      if (projectsRes.ok) {
        const p = await projectsRes.json()
        setProjects(Array.isArray(p) ? p : [])
      }

      if (orgBudgetRes.ok) {
        setOrgBudget(await orgBudgetRes.json())
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
    setProjectId("")
    setYear(new Date().getFullYear().toString())
    setDepartment("")
    setAllocatedAmount("")
    setSpentAmount("0")
    setEditingBudget(null)
    setError("")
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (budget: any) => {
    setEditingBudget(budget)
    setProjectId(budget.projectId?._id || budget.projectId)
    setYear(budget.year?.toString() || new Date().getFullYear().toString())
    setDepartment(budget.department || "")
    setAllocatedAmount(budget.allocatedAmount?.toString() || "")
    setSpentAmount(budget.spentAmount?.toString() || "0")
    setError("")
    setDialogOpen(true)
  }

  const openDeleteDialog = (budget: any) => {
    setBudgetToDelete(budget)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const payload: any = {
        projectId,
        year: parseInt(year),
        department,
        allocatedAmount: parseFloat(allocatedAmount),
        spentAmount: parseFloat(spentAmount)
      }

      if (editingBudget) {
        const res = await fetch(`/api/budget/${editingBudget._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year: payload.year,
            allocatedAmount: payload.allocatedAmount,
            spentAmount: payload.spentAmount,
            department: payload.department
          }),
        })
        if (!res.ok) throw new Error((await res.json()).message || "Failed to update budget")
      } else {
        const res = await fetch("/api/budget", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json()).message || "Failed to create budget")
      }

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
    if (!budgetToDelete) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/budget/${budgetToDelete._id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete budget")
      setDeleteDialogOpen(false)
      setBudgetToDelete(null)
      fetchData()
    } catch (err: any) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const openHistoryDialog = async (budget: any) => {
    setSelectedBudgetForHistory(budget)
    setHistoryDialogOpen(true)
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/budget/${budget._id}/history`)
      if (res.ok) {
        setBudgetHistory(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleOrgBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/budget/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            year: orgBudget.year, 
            totalAmount: parseFloat(newOrgAmount) 
        }),
      })
      if (res.ok) {
        setOrgBudget(await res.json())
        setOrgBudgetDialogOpen(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  // Analytics
  const summary = useMemo(() => {
    let totalAllocated = 0
    let totalSpent = 0
    let highRiskCount = 0

    budgets.forEach(b => {
      totalAllocated += b.allocatedAmount || 0
      totalSpent += b.spentAmount || 0
      if (b.riskLevel === "HIGH") highRiskCount++
    })

    return { totalAllocated, totalSpent, remaining: totalAllocated - totalSpent, highRiskCount }
  }, [budgets])

  // Chart Data (Group by Department)
  const chartData = useMemo(() => {
    const deptMap: { [key: string]: { name: string; allocated: number; spent: number } } = {}
    
    budgets.forEach(b => {
      const dept = b.department || "Unknown"
      if (!deptMap[dept]) {
        deptMap[dept] = { name: dept, allocated: 0, spent: 0 }
      }
      deptMap[dept].allocated += b.allocatedAmount || 0
      deptMap[dept].spent += b.spentAmount || 0
    })

    return Object.values(deptMap)
  }, [budgets])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(val)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">ระบบงบประมาณ (Budgets)</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              const data = budgets.map(b => ({
                "โครงการ": b.projectId?.name || "N/A",
                "หน่วยงาน": b.department,
                "ปีงบประมาณ": b.year,
                "งบจัดสรร": b.allocatedAmount,
                "เบิกจ่าย": b.spentAmount,
                "คงเหลือ": (b.allocatedAmount || 0) - (b.spentAmount || 0),
                "ความเสี่ยง": b.riskLevel
              }));
              import("@/lib/utils/reports").then(m => m.exportToExcel(data, "budget-report"));
            }}
            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setLoading(true)
              try {
                const res = await fetch("/api/budget/analyze", { method: "POST" })
                if (res.ok) fetchData()
              } catch (e) {
                console.error(e)
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            className="gap-2 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
          >
            <Sparkles className="h-4 w-4" /> วิเคราะห์ความเสี่ยงด้วย AI
          </Button>
          <button
            onClick={openCreateDialog}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> เพิ่มงบประมาณ
          </button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingBudget ? "แก้ไขงบประมาณ" : "เพิ่มงบประมาณโครงการ"}</DialogTitle>
              <DialogDescription>
                {editingBudget ? "แก้ไขข้อมูลและเบิกจ่ายงบประมาณ" : "กำหนดงบประมาณตั้งต้นสำหรับโครงการในปีงบประมาณ"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error && (
                <div className="bg-destructive/15 text-destructive text-xs p-2 rounded border border-destructive/20">
                  {error}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="project">โครงการ</Label>
                <Select value={projectId} onValueChange={(v: string | null) => setProjectId(v || "")}>
                  <SelectTrigger id="project">
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
                <Label htmlFor="department">หน่วยงาน / สำนัก</Label>
                <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="เช่น กองคลัง, กองช่าง" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="year">ปีงบประมาณ</Label>
                  <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} required min={2000} max={2100} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">งบจัดสรรตั้งต้น (บาท)</Label>
                  <Input id="amount" type="number" value={allocatedAmount} onChange={(e) => setAllocatedAmount(e.target.value)} placeholder="0.00" required min={0} step="0.01" />
                </div>
              </div>
              {editingBudget && (
                <div className="grid gap-2">
                  <Label htmlFor="spent">เบิกจ่ายไปแล้ว (บาท)</Label>
                  <Input id="spent" type="number" value={spentAmount} onChange={(e) => setSpentAmount(e.target.value)} placeholder="0.00" required min={0} step="0.01" className="bg-muted" />
                  <p className="text-[10px] text-muted-foreground">ใช้สำหรับปรับปรุงยอดการเบิกจ่ายจริงเพื่อคำนวณความเสี่ยง</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <button type="submit" disabled={submitting || !projectId} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                บันทึกข้อมูล
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบงบประมาณ</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบรายการงบประมาณนี้? หากลบไปแล้วจะไม่สามารถกู้คืนได้ และจะถูกนำออกจากยอดรวม
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ลบข้อมูล
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              สมุดบันทึกรายการเบิกจ่าย (Disbursement Ledger)
            </DialogTitle>
            <DialogDescription>
              {selectedBudgetForHistory?.projectId?.name} - งบปี {selectedBudgetForHistory?.year} ({selectedBudgetForHistory?.department})
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            {loadingHistory ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : budgetHistory.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground">ยังไม่มีรายการเบิกจ่ายที่อนุมัติสำหรับงบประมาณนี้</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                   <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">งบประมาณจัดสรร</p>
                      <p className="text-lg font-bold">{formatCurrency(selectedBudgetForHistory?.allocatedAmount)}</p>
                   </div>
                   <div className="p-3 bg-indigo-50 rounded-lg">
                      <p className="text-xs text-indigo-600">เบิกจ่ายไปแล้ว</p>
                      <p className="text-lg font-bold text-indigo-700">{formatCurrency(selectedBudgetForHistory?.spentAmount)}</p>
                   </div>
                   <div className="p-3 bg-emerald-50 rounded-lg">
                      <p className="text-xs text-emerald-600">คงเหลือสุทธิ</p>
                      <p className="text-lg font-bold text-emerald-700">{formatCurrency((selectedBudgetForHistory?.allocatedAmount || 0) - (selectedBudgetForHistory?.spentAmount || 0))}</p>
                   </div>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>วันที่เบิกจ่าย</TableHead>
                        <TableHead>รายการ/รายละเอียด</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead className="text-right">จำนวนเงิน (บาท)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budgetHistory.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell className="whitespace-nowrap">{new Date(item.disbursementDate).toLocaleDateString("th-TH")}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{item.title}</TableCell>
                          <TableCell>
                            {item.status === "APPROVED" ? (
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px] h-5">อนุมัติแล้ว</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] h-5">รออนุมัติ</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{new Intl.NumberFormat("th-TH").format(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setHistoryDialogOpen(false)}>ปิดหน้าต่าง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={orgBudgetDialogOpen} onOpenChange={setOrgBudgetDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleOrgBudgetSubmit}>
            <DialogHeader>
              <DialogTitle>ตั้งค่ามบประมาณจัดสรรรวม (Organization)</DialogTitle>
              <DialogDescription>กำหนดงบประมาณรวมทั้งองค์กรสำหรับปี {orgBudget.year}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="org-total">งบประมาณรวมทั้งหมด (บาท)</Label>
                <Input id="org-total" type="number" value={newOrgAmount} onChange={(e) => setNewOrgAmount(e.target.value)} required min={0} step="0.01" autoFocus />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                บันทึกงบทวรงค์กร
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-2 border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-primary">งบประมาณจัดสรรรวม (Org)</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(orgBudget.totalAmount)}</div>
            <div className="mt-2 space-y-1">
               <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                  <span>จัดสรรลงโครงการแล้ว</span>
                  <span>{((summary.totalAllocated / (orgBudget.totalAmount || 1)) * 100).toFixed(1)}%</span>
               </div>
               <Progress value={(summary.totalAllocated / (orgBudget.totalAmount || 1)) * 100} className="h-1.5" />
            </div>
            <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-4 h-7 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                onClick={() => { setNewOrgAmount(orgBudget.totalAmount.toString()); setOrgBudgetDialogOpen(true) }}
            >
                จัดการงบประมาณประจำปี
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">งบประมาณโครงการรวม</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalAllocated)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              จากทั้งหมด {budgets.length} รายการ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">งบรอการจัดสรร (คงเหลือ)</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(Math.max(0, orgBudget.totalAmount - summary.totalAllocated))}</div>
            <p className={cn("text-xs mt-1 font-medium", orgBudget.totalAmount < summary.totalAllocated ? "text-destructive" : "text-emerald-600")}>
              {orgBudget.totalAmount < summary.totalAllocated ? "จัดสรรเกินงบประมาณรวม!" : "คงเหลือสำหรับโครงการอื่นๆ"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ความเสี่ยงเกินงบ (High Risk)</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.highRiskCount} โครงการ</div>
            <p className="text-xs text-muted-foreground mt-1">AI ตรวจพบความเสี่ยงเบิกจ่ายเกินเป้า</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>ภาพรวมงบประมาณรายหน่วยงาน</CardTitle>
            <CardDescription>เปรียบเทียบงบจัดสรรกับการเบิกจ่าย</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `฿${value / 1000}k`} />
                  <Tooltip 
                    formatter={(value: any) => [new Intl.NumberFormat("th-TH").format(Number(value)) + " บาท", ""]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <Legend />
                  <Bar dataKey="allocated" name="งบจัดสรรจัดตั้ง" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="เบิกจ่ายจริง" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>ความเสี่ยงโครงการ (AI Prediction)</CardTitle>
            <CardDescription>การประเมินความเสี่ยงต่อการเบิกจ่ายเกินเป้า</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgets.slice(0, 5).map(b => (
                 <div key={b._id} className="flex items-center justify-between p-3 border rounded-lg bg-card transition-all hover:shadow-sm">
                   <div className="space-y-1">
                     <p className="text-sm font-medium leading-none">{b.projectId?.name || "โครงการ..."}</p>
                     <p className="text-xs text-muted-foreground">{b.department}</p>
                   </div>
                   <div className="text-right">
                      {b.riskLevel === "HIGH" ? (
                        <Badge variant="destructive" className="ml-auto">เสี่ยงสูง (เกิน 100%)</Badge>
                      ) : b.riskLevel === "MEDIUM" ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 ml-auto border-amber-200">เสี่ยงปานกลาง (&gt;80%)</Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 ml-auto bg-emerald-50">ปกติ</Badge>
                      )}
                   </div>
                 </div>
              ))}
              {budgets.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">ไม่มีข้อมูลโครงการ</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการงบประมาณ (พ.ร.บ. งบประมาณรายจ่าย)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>โครงการ</TableHead>
                <TableHead>หน่วยงาน/กอง</TableHead>
                <TableHead>ปีงบประมาณ</TableHead>
                <TableHead className="text-right">งบจัดสรร (บาท)</TableHead>
                <TableHead className="text-right">เบิกจ่าย (บาท)</TableHead>
                <TableHead className="text-right">คงเหลือ (บาท)</TableHead>
                <TableHead>ความเสี่ยง</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : budgets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    ไม่พบข้อมูลรายการงบประมาณ
                  </TableCell>
                </TableRow>
              ) : (
                budgets.map((b) => (
                  <TableRow key={b._id}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={b.projectId?.name}>{b.projectId?.name || "N/A"}</TableCell>
                    <TableCell>{b.department}</TableCell>
                    <TableCell>{b.year}</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat("th-TH").format(b.allocatedAmount)}</TableCell>
                    <TableCell className="text-right text-emerald-600">{new Intl.NumberFormat("th-TH").format(b.spentAmount || 0)}</TableCell>
                    <TableCell className="text-right font-medium">{new Intl.NumberFormat("th-TH").format((b.allocatedAmount || 0) - (b.spentAmount || 0))}</TableCell>
                    <TableCell>
                      {b.riskLevel === "HIGH" ? (
                        <Badge variant="destructive">สูง</Badge>
                      ) : b.riskLevel === "MEDIUM" ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">ปานกลาง</Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">ต่ำ</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => openHistoryDialog(b)} title="ดูประวัติการเบิกจ่าย">
                        <History className="h-4 w-4 text-indigo-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(b)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog(b)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

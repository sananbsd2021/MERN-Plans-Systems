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
import { Plus, Loader2, DollarSign, TextSelect, Trash2, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function DisbursementsPage() {
  const [disbursements, setDisbursements] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  
  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // Form State
  const [projectId, setProjectId] = useState("")
  const [budgets, setBudgets] = useState<any[]>([])
  const [selectedBudgetId, setSelectedBudgetId] = useState("")
  const [availableAmount, setAvailableAmount] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0])
  const [remarks, setRemarks] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [disbRes, projRes] = await Promise.all([
        fetch("/api/disbursements"),
        fetch("/api/projects")
      ])
      
      if (disbRes.ok) {
        setDisbursements(await disbRes.json())
      }
      if (projRes.ok) {
        setProjects(await projRes.json())
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

  // Fetch budgets when project changes
  useEffect(() => {
    if (!projectId) {
      setBudgets([])
      setSelectedBudgetId("")
      setAvailableAmount(null)
      return
    }

    const fetchBudgets = async () => {
      try {
        const res = await fetch(`/api/budget?projectId=${projectId}`)
        if (res.ok) {
          const data = await res.json()
          setBudgets(data)
          if (data.length > 0) {
            setSelectedBudgetId(data[0]._id)
            setAvailableAmount(data[0].remainingAmount)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchBudgets()
  }, [projectId])

  const handleBudgetChange = (id: string | null) => {
    if (!id) return
    setSelectedBudgetId(id)
    const budget = budgets.find(b => b._id === id)
    if (budget) {
      setAvailableAmount(budget.remainingAmount)
    }
  }

  const resetForm = () => {
    setProjectId("")
    setBudgets([])
    setSelectedBudgetId("")
    setAvailableAmount(null)
    setTitle("")
    setAmount("")
    setDisbursementDate(new Date().toISOString().split('T')[0])
    setRemarks("")
    setError("")
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const numAmount = parseFloat(amount)
    if (availableAmount !== null && numAmount > availableAmount) {
        if (!confirm("จำนวนเงินเบิกจ่ายเกินงบประมาณที่คงเหลือ คุณต้องการดำเนินการต่อหรือไม่?")) {
            return
        }
    }

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/disbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          projectId, 
          budgetId: selectedBudgetId,
          title, 
          amount: numAmount, 
          disbursementDate, 
          remarks 
        }),
      })

      if (!res.ok) throw new Error((await res.json()).message || "Failed to create disbursement")

      setDialogOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`ยืนยันการเปลี่ยนสถานะเป็น ${newStatus} หรือไม่? (ถ้าอนุมัติ จะไปหักยอดงบประมาณ)`)) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/disbursements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      fetchData()
    } catch (err: any) {
      console.error(err)
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการเบิกจ่ายนี้?")) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/disbursements/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      fetchData()
    } catch (err: any) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">ระบบเบิกจ่าย (Disbursements)</h2>
        <Button
          onClick={() => { resetForm(); setDialogOpen(true) }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> สร้างรายการเบิกจ่าย
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>สร้างรายการเบิกจ่ายใหม่</DialogTitle>
              <DialogDescription>
                บันทึกคำขอเบิกจ่ายเงินจากโครงการ หลังจากอนุมัติระบบจะตัดยอดงบประมาณอัตโนมัติ
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</div>}
              
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

              {projectId && budgets.length > 0 && (
                <div className="grid gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                   <Label htmlFor="budget">งบประมาณที่ใช้ (ปี/แผนก)</Label>
                   <Select value={selectedBudgetId} onValueChange={(v: string | null) => handleBudgetChange(v)}>
                     <SelectTrigger id="budget" className="bg-background">
                       <SelectValue placeholder="เลือกงบประมาณ" />
                     </SelectTrigger>
                     <SelectContent>
                       {budgets.map((b) => (
                         <SelectItem key={b._id} value={b._id}>ปี {b.year} - {b.department}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                   {availableAmount !== null && (
                     <div className="flex justify-between items-center mt-1 text-xs">
                        <span className="text-muted-foreground">งบประมาณคงเหลือ:</span>
                        <span className={cn("font-bold", availableAmount <= 0 ? "text-destructive" : "text-emerald-600")}>
                          {new Intl.NumberFormat("th-TH").format(availableAmount)} บาท
                        </span>
                     </div>
                   )}
                </div>
              )}

              {projectId && budgets.length === 0 && (
                <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20">
                  ไม่พบข้อมูลมบประมาณสำหรับโครงการนี้ในระบบ
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="title">รายการ/รายละเอียดเบิกจ่าย</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ค่าจ้างผู้รับเหมางวด 1" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">จำนวนเงิน (บาท)</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    min={0.01} 
                    step="0.01" 
                    required 
                    className={cn(availableAmount !== null && parseFloat(amount) > availableAmount && "border-destructive text-destructive focus-visible:ring-destructive")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">วันที่เบิกจ่าย</Label>
                  <Input id="date" type="date" value={disbursementDate} onChange={(e) => setDisbursementDate(e.target.value)} required />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="remarks">หมายเหตุเพิ่มเติม</Label>
                <Input id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting || !projectId || budgets.length === 0} className="w-full">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} บันทึกคำขอเบิกจ่าย
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>รายการเบิกจ่ายทั้งหมด</CardTitle>
          <CardDescription>แสดงรายการคำขอเบิกจ่าย สามารถกดอนุมัติเพื่อตัดยอดงบประมาณของโครงการได้</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead>โครงการ</TableHead>
                <TableHead>รายการเบิกจ่าย</TableHead>
                <TableHead className="text-right">จำนวนเงิน (บาท)</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการคำขอ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : disbursements.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">ยังไม่มีรายการเบิกจ่าย</TableCell></TableRow>
              ) : (
                disbursements.map((d) => (
                  <TableRow key={d._id}>
                    <TableCell>{new Date(d.createdAt).toLocaleDateString("th-TH")}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{d.projectId?.name}</TableCell>
                    <TableCell>{d.title}</TableCell>
                    <TableCell className="text-right font-medium">{new Intl.NumberFormat("th-TH").format(d.amount)}</TableCell>
                    <TableCell>
                      {d.status === "APPROVED" ? <Badge className="bg-emerald-500 hover:bg-emerald-600">อนุมัติแล้ว</Badge> : d.status === "REJECTED" ? <Badge variant="destructive">ไม่อนุมัติ</Badge> : <Badge variant="secondary">รออนุมัติ</Badge>}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {d.status === "PENDING" && (
                        <>
                          <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => updateStatus(d._id, "APPROVED")}>
                            <CheckCircle className="h-4 w-4" /> 
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateStatus(d._id, "REJECTED")}>
                            <XCircle className="h-4 w-4" /> 
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => handleDelete(d._id)}>
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

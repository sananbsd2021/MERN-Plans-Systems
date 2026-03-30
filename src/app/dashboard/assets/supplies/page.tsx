"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Plus, ArrowDownLeft, ArrowUpRight, History } from "lucide-react"

export default function SuppliesPage() {
  const [supplies, setSupplies] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [categories, setCategories] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [txDialogOpen, setTxDialogOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    categoryId: "",
    minQuantity: 0,
  })

  const [txData, setTxData] = useState({
    supplyId: "",
    type: "IN",
    quantity: 0,
    departmentId: "",
    note: "",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [suppRes, catRes, deptRes, txRes] = await Promise.all([
        fetch("/api/assets/supplies"),
        fetch("/api/assets/categories?type=SUPPLY"),
        fetch("/api/hrms/departments"),
        fetch("/api/assets/supplies/transactions")
      ])
      setSupplies(await suppRes.json())
      setCategories(await catRes.json())
      setDepartments(await deptRes.json())
      setTransactions(await txRes.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddSupply = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/assets/supplies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setDialogOpen(false)
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/assets/supplies/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txData),
      })
      if (res.ok) {
        setTxDialogOpen(false)
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ระบบบริหารพัสดุ</h2>
          <p className="text-muted-foreground">จัดการวัสดุสิ้นเปลือง การรับเข้า และการเบิกจ่าย</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
            <DialogTrigger 
              render={
                <Button variant="outline" className="gap-2">
                  <History className="h-4 w-4" /> บันทึกการเบิก/รับพัสดุ
                </Button>
              }
            />
            <DialogContent>
              <form onSubmit={handleTransaction}>
                <DialogHeader>
                  <DialogTitle>บันทึกการเคลื่อนไหวพัสดุ</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>พัสดุ</Label>
                    <Select onValueChange={(v: string | null) => setTxData({...txData, supplyId: v || ""})}>
                      <SelectTrigger><SelectValue placeholder="เลือกพัสดุ..." /></SelectTrigger>
                      <SelectContent>
                        {supplies.map(s => <SelectItem key={s._id} value={s._id}>{s.name} ({s.unit})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>ประเภท</Label>
                    <Select defaultValue="IN" onValueChange={(v: string | null) => setTxData({...txData, type: (v || "IN") as any})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN">รับเข้า (Stock In)</SelectItem>
                        <SelectItem value="OUT">เบิกจ่าย (Stock Out)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>จำนวน</Label>
                    <Input type="number" min="1" onChange={(e) => setTxData({...txData, quantity: Number(e.target.value)})} />
                  </div>
                  {txData.type === "OUT" && (
                    <div className="grid gap-2">
                      <Label>หน่วยงานที่เบิก</Label>
                      <Select onValueChange={(v: string | null) => setTxData({...txData, departmentId: v || ""})}>
                        <SelectTrigger><SelectValue placeholder="เลือกกอง..." /></SelectTrigger>
                        <SelectContent>
                          {departments.map(d => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label>หมายเหตุ</Label>
                    <Input onChange={(e) => setTxData({...txData, note: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    บันทึกรายการ
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger 
              render={
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> เพิ่มพัสดุใหม่
                </Button>
              }
            />
            <DialogContent>
              <form onSubmit={handleAddSupply}>
                <DialogHeader>
                  <DialogTitle>ลงทะเบียนพัสดุ/วัสดุ</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>ชื่อพัสดุ</Label>
                    <Input id="name" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>หน่วยนับ</Label>
                    <Input id="unit" placeholder="เช่น ชิ้น, กล่อง, ม้วน" onChange={(e) => setFormData({...formData, unit: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>หมวดหมู่</Label>
                    <Select onValueChange={(v: string | null) => setFormData({...formData, categoryId: v || ""})}>
                      <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่..." /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>จุดสั่งซื้อขั้นต่ำ</Label>
                    <Input type="number" onChange={(e) => setFormData({...formData, minQuantity: Number(e.target.value)})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    บันทึกข้อมูล
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>รายการพัสดุคงคลัง</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>พัสดุ</TableHead>
                    <TableHead>หมวดหมู่</TableHead>
                    <TableHead className="text-right">คงเหลือ</TableHead>
                    <TableHead>หน่วย</TableHead>
                    <TableHead>สถานะ Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplies.map((s) => (
                    <TableRow key={s._id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.categoryId?.name}</TableCell>
                      <TableCell className="text-right text-lg font-bold">{s.currentQuantity}</TableCell>
                      <TableCell>{s.unit}</TableCell>
                      <TableCell>
                        {s.currentQuantity <= s.minQuantity ? (
                          <Badge variant="destructive">พัสดุใกล้หมด</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-200">ปกติ</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>การเคลื่อนไหวล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.slice(0, 5).map((t) => (
                <div key={t._id} className="flex items-center gap-4 text-sm">
                  <div className={`p-2 rounded-full ${t.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {t.type === 'IN' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{t.supplyId?.name}</div>
                    <div className="text-xs text-muted-foreground">{t.departmentId?.name || "รับเข้าสต็อก"}</div>
                  </div>
                  <div className={`font-bold ${t.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'IN' ? '+' : '-'}{t.quantity}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

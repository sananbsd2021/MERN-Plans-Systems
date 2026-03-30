"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, Loader2, Landmark, History, Banknote } from "lucide-react"

export default function AssetsPage() {
  const [payers, setPayers] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)

  // Asset Form State
  const [assetForm, setAssetForm] = useState({
    payerId: "",
    type: "LAND",
    appraisedValue: 0,
    details: ""
  })

  // Assessment Form State
  const [assessmentForm, setAssessmentForm] = useState({
    year: new Date().getFullYear(),
    amountDue: 0,
    dueDate: new Date().toISOString().split('T')[0],
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, aRes] = await Promise.all([
        fetch("/api/revenue/payers"),
        fetch("/api/revenue/assets")
      ])
      const pData = await pRes.json()
      const aData = await aRes.json()
      setPayers(Array.isArray(pData) ? pData : [])
      setAssets(Array.isArray(aData) ? aData : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/revenue/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetForm),
      })
      if (!res.ok) throw new Error("Failed to save asset")
      setAssetDialogOpen(false)
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/revenue/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...assessmentForm,
          assetId: selectedAsset._id,
          payerId: selectedAsset.payerId?._id
        }),
      })
      if (!res.ok) throw new Error("Failed to save assessment")
      setAssessmentDialogOpen(false)
      fetchData()
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
          <h2 className="text-3xl font-bold tracking-tight">จัดการสิ่งปลูกสร้าง & การประเมิน</h2>
          <p className="text-muted-foreground">บันทึกข้อมูลทรัพย์สินที่อยู่ในข่ายภาษีและดำเนินการประเมินรายปี</p>
        </div>
        <Button onClick={() => setAssetDialogOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4" /> บันทึกทรัพย์สินใหม่
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการทรัพย์สินและสถานะการประเมิน</CardTitle>
          <CardDescription>แสดงข้อมูลทรัพย์สินแยกตามรายบุคคล</CardDescription>
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
                  <TableHead>เจ้าของ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>ราคาประเมิน (กลาง)</TableHead>
                  <TableHead>พิกัด/รายละเอียด</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset._id}>
                    <TableCell className="font-medium">{asset.payerId?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Building2 className="h-3 w-3" /> {asset.type}
                      </Badge>
                    </TableCell>
                    <TableCell>฿{asset.appraisedValue.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{asset.details || "-"}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-blue-600 font-semibold h-8"
                        onClick={() => { setSelectedAsset(asset); setAssessmentDialogOpen(true); }}
                      >
                        <Banknote className="h-4 w-4 mr-1" /> ประเมิน
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8">
                        <History className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {assets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                      ยังไม่มีข้อมูลทรัพย์สินในระบบ
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Asset Dialog */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAssetSubmit}>
            <DialogHeader>
              <DialogTitle>บันทึกทรัพย์สิน/สิ่งปลูกสร้าง</DialogTitle>
              <DialogDescription>เพิ่มข้อมูลที่ดิน โรงเรือน หรือป้ายเข้าสู่ระบบ</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>เลือกผู้เสียภาษี (เจ้าของ)</Label>
                <Select value={assetForm.payerId} onValueChange={(v: string | null) => setAssetForm({...assetForm, payerId: v || ""})}>
                  <SelectTrigger><SelectValue placeholder="ค้นหาเจ้าของ..." /></SelectTrigger>
                  <SelectContent>
                    {payers.map((p) => (
                      <SelectItem key={p._id} value={p._id}>{p.name} ({p.taxId})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>ประเภททรัพย์สิน</Label>
                <Select value={assetForm.type} onValueChange={(v: string | null) => setAssetForm({...assetForm, type: (v || "LAND") as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAND">ที่ดิน (Land)</SelectItem>
                    <SelectItem value="BUILDING">โรงเรือน/สิ่งปลูกสร้าง (Building)</SelectItem>
                    <SelectItem value="SIGNBOARD">ป้าย (Signboard)</SelectItem>
                    <SelectItem value="OTHER">อื่นๆ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>มูลค่าประเมิน (ทุนทรัพย์)</Label>
                <Input type="number" value={assetForm.appraisedValue} onChange={(e) => setAssetForm({...assetForm, appraisedValue: Number(e.target.value)})} />
              </div>
              <div className="grid gap-2">
                <Label>รายละเอียดเพิ่มเติ่ม / เลขที่โฉนด</Label>
                <Input value={assetForm.details} onChange={(e) => setAssetForm({...assetForm, details: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="bg-blue-600">บันทึกข้อมูล</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assessment Dialog */}
      <Dialog open={assessmentDialogOpen} onOpenChange={setAssessmentDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAssessmentSubmit}>
            <DialogHeader>
              <DialogTitle>ดำเนินการประเมินภาษีรายปี</DialogTitle>
              <DialogDescription>ระบุจำนวนเงินภาษีที่ต้องชำระของปี {assessmentForm.year}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedAsset && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-md text-sm">
                  <p className="font-semibold text-blue-800">ข้อมูลทรัพย์สิน: {selectedAsset.type}</p>
                  <p className="text-blue-600 italic">เจ้าของ: {selectedAsset.payerId?.name}</p>
                </div>
              )}
              <div className="grid gap-2">
                <Label>ปีงบประมาณที่ประเมิน</Label>
                <Input type="number" value={assessmentForm.year} onChange={(e) => setAssessmentForm({...assessmentForm, year: Number(e.target.value)})} />
              </div>
              <div className="grid gap-2">
                <Label>จำนวนภาษีประเมิน (บาท)</Label>
                <Input type="number" value={assessmentForm.amountDue} onChange={(e) => setAssessmentForm({...assessmentForm, amountDue: Number(e.target.value)})} />
              </div>
              <div className="grid gap-2">
                <Label>วันสุดท้ายที่ชำระได้ (Due Date)</Label>
                <Input type="date" value={assessmentForm.dueDate} onChange={(e) => setAssessmentForm({...assessmentForm, dueDate: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="bg-blue-600">ส่งการประเมิน</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

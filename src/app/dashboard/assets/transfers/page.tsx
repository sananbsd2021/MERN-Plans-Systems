"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { ArrowRightLeft, Search, Plus, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AssetTransferPage() {
  const [transfers, setTransfers] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    assetId: "",
    fromDepartmentId: "",
    toDepartmentId: "",
    transferDate: new Date().toISOString().split('T')[0],
    reason: "",
  })

  useEffect(() => {
    fetchTransfers()
    fetchAssets()
    fetchDepartments()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await fetch("/api/assets")
      const data = await response.json()
      setAssets(data)
    } catch (error) {
      console.error("Failed to fetch assets:", error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/hrms/departments")
      const data = await response.json()
      setDepartments(data)
    } catch (error) {
      console.error("Failed to fetch departments:", error)
    }
  }

  const fetchTransfers = async () => {
    try {
      const response = await fetch("/api/assets/transfers")
      const data = await response.json()
      setTransfers(data)
    } catch (error) {
      console.error("Failed to fetch transfer history:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssetChange = (assetId: string | null) => {
    if (!assetId) return
    const asset = assets.find(a => a._id === assetId)
    setFormData({
      ...formData,
      assetId,
      fromDepartmentId: asset?.departmentId?._id || asset?.departmentId || ""
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    if (formData.fromDepartmentId === formData.toDepartmentId) {
      setError("หน่วยงานต้นทางและปลายทางต้องไม่ใช่อันเดียวกัน")
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch("/api/assets/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to transfer asset")

      setDialogOpen(false)
      setFormData({
        assetId: "",
        fromDepartmentId: "",
        toDepartmentId: "",
        transferDate: new Date().toISOString().split('T')[0],
        reason: "",
      })
      fetchTransfers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredTransfers = transfers.filter((t) =>
    t.assetId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.assetId?.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.fromDepartmentId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.toDepartmentId?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ประวัติการโอนย้าย</h1>
          <p className="text-muted-foreground">ติดตามการโอนย้ายครุภัณฑ์ระหว่างหน่วยงานภายใน</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <ArrowRightLeft className="h-4 w-4" /> โอนย้ายครุภัณฑ์
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาตามชื่อครุภัณฑ์, รหัส หรือหน่วยงาน..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            รายการโอนย้าย
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8 text-muted-foreground">กำลังโหลดข้อมูล...</div>
          ) : filteredTransfers.length === 0 ? (
            <div className="flex justify-center p-8 text-muted-foreground">ไม่พบรายการโอนย้าย</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ครุภัณฑ์</TableHead>
                    <TableHead>จากหน่วยงาน</TableHead>
                    <TableHead>ไปยังหน่วยงาน</TableHead>
                    <TableHead>วันที่โอนย้าย</TableHead>
                    <TableHead>เหตุผล</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.map((t) => (
                    <TableRow key={t._id}>
                      <TableCell>
                        <div className="font-medium">{t.assetId?.name}</div>
                        <div className="text-xs text-muted-foreground">{t.assetId?.assetCode}</div>
                      </TableCell>
                      <TableCell>{t.fromDepartmentId?.name}</TableCell>
                      <TableCell>{t.toDepartmentId?.name}</TableCell>
                      <TableCell>
                        {format(new Date(t.transferDate), "dd MMM yyyy", { locale: th })}
                      </TableCell>
                      <TableCell>{t.reason || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>โอนย้ายครุภัณฑ์</DialogTitle>
              <DialogDescription>บันทึกการเปลี่ยนหน่วยงานที่รับผิดชอบดูแลครุภัณฑ์</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-100">{error}</div>}
              
              <div className="grid gap-2">
                <Label>เลือกครุภัณฑ์</Label>
                <Select value={formData.assetId || ""} onValueChange={(v: string | null) => handleAssetChange(v)}>
                  <SelectTrigger><SelectValue placeholder="ค้นหาครุภัณฑ์..." /></SelectTrigger>
                  <SelectContent>
                    {assets.map((a) => (
                      <SelectItem key={a._id} value={a._id}>{a.name} ({a.assetCode})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>จากหน่วยงาน</Label>
                <div className="p-2 bg-muted rounded text-sm text-muted-foreground italic">
                  {departments.find(d => d._id === formData.fromDepartmentId)?.name || "รอเลือกครุภัณฑ์"}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>ไปยังหน่วยงาน</Label>
                <Select value={formData.toDepartmentId || ""} onValueChange={(v: string | null) => setFormData({...formData, toDepartmentId: v || ""})}>
                  <SelectTrigger><SelectValue placeholder="เลือกหน่วยงานปลายทาง..." /></SelectTrigger>
                  <SelectContent>
                    {departments.filter(d => d._id !== formData.fromDepartmentId).map((d) => (
                      <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="transferDate">วันที่โอนย้าย</Label>
                <Input id="transferDate" type="date" value={formData.transferDate} onChange={(e) => setFormData({...formData, transferDate: e.target.value})} required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reason">เหตุผลการโอนย้าย</Label>
                <Input id="reason" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} placeholder="เช่น ยืมใช้งานชั่วคราว, ย้ายที่ปฏิบัติงาน" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>ยกเลิก</Button>
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ยืนยันการโอนย้าย
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

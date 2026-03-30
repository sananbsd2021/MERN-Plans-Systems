"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { Wrench, Search, Filter, Plus, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AssetMaintenancePage() {
  const [maintenances, setMaintenances] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    assetId: "",
    maintenanceDate: new Date().toISOString().split('T')[0],
    cost: 0,
    description: "",
    provider: "",
  })

  useEffect(() => {
    fetchMaintenances()
    fetchAssets()
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

  const fetchMaintenances = async () => {
    try {
      const response = await fetch("/api/assets/maintenances")
      const data = await response.json()
      setMaintenances(data)
    } catch (error) {
      console.error("Failed to fetch maintenance history:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/assets/maintenances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to record maintenance")

      setDialogOpen(false)
      setFormData({
        assetId: "",
        maintenanceDate: new Date().toISOString().split('T')[0],
        cost: 0,
        description: "",
        provider: "",
      })
      fetchMaintenances()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredMaintenances = maintenances.filter((m) =>
    m.assetId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.assetId?.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ประวัติการซ่อมบำรุง</h1>
          <p className="text-muted-foreground">ติดตามรายการซ่อมบำรุงและดูแลรักษาครุภัณฑ์</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4" /> บันทึกการซ่อมบำรุง
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาตามชื่อครุภัณฑ์, รหัส หรือรายการ..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-600" />
            รายการซ่อมบำรุง
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8 text-muted-foreground">กำลังโหลดข้อมูล...</div>
          ) : filteredMaintenances.length === 0 ? (
            <div className="flex justify-center p-8 text-muted-foreground">ไม่พบรายการซ่อมบำรุง</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ครุภัณฑ์</TableHead>
                    <TableHead>รายการซ่อม/บำรุง</TableHead>
                    <TableHead>วันที่ดำเนินการ</TableHead>
                    <TableHead className="text-right">ค่าใช้จ่าย</TableHead>
                    <TableHead>ผู้ดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenances.map((m) => (
                    <TableRow key={m._id}>
                      <TableCell>
                        <div className="font-medium">{m.assetId?.name}</div>
                        <div className="text-xs text-muted-foreground">{m.assetId?.assetCode}</div>
                      </TableCell>
                      <TableCell>{m.description}</TableCell>
                      <TableCell>
                        {format(new Date(m.maintenanceDate), "dd MMM yyyy", { locale: th })}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.cost.toLocaleString()} บาท
                      </TableCell>
                      <TableCell>{m.provider || "-"}</TableCell>
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
              <DialogTitle>บันทึกประวัติการซ่อมบำรุง</DialogTitle>
              <DialogDescription>ระบุรายละเอียดการซ่อมแซมหรือบำรุงรักษาครุภัณฑ์</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-100">{error}</div>}
              
              <div className="grid gap-2">
                <Label>เลือกครุภัณฑ์</Label>
                <Select value={formData.assetId || ""} onValueChange={(v: string | null) => setFormData({...formData, assetId: v || ""})}>
                  <SelectTrigger><SelectValue placeholder="ค้นหาครุภัณฑ์..." /></SelectTrigger>
                  <SelectContent>
                    {assets.map((a) => (
                      <SelectItem key={a._id} value={a._id}>{a.name} ({a.assetCode})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maintenanceDate">วันที่ดำเนินการ</Label>
                <Input id="maintenanceDate" type="date" value={formData.maintenanceDate} onChange={(e) => setFormData({...formData, maintenanceDate: e.target.value})} required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cost">ค่าใช้จ่าย (บาท)</Label>
                <Input id="cost" type="number" value={formData.cost} onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})} required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">รายการซ่อม/บำรุง</Label>
                <Input id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="เช่น เปลี่ยนถ่ายน้ำมันเครื่อง" required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="provider">ผู้ดำเนินการ / ร้านค้า</Label>
                <Input id="provider" value={formData.provider} onChange={(e) => setFormData({...formData, provider: e.target.value})} placeholder="เช่น ศูนย์บริการ Isuzu" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>ยกเลิก</Button>
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                บันทึกข้อมูล
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

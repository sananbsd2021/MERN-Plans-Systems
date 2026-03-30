"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Printer, Download, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function RegistryPage() {
  const [assets, setAssets] = useState<any[]>([])
  const [supplies, setSupplies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch("/api/assets"),
      fetch("/api/assets/supplies")
    ]).then(async ([aRes, sRes]) => {
      setAssets(await aRes.json())
      setSupplies(await sRes.json())
      setLoading(false)
    })
  }, [])

  const handlePrint = () => window.print()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ทะเบียนทรัพย์สินและพัสดุ</h2>
          <p className="text-muted-foreground">รายงานสรุปทะเบียนพัสดุและครุภัณฑ์ประจำปี</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> พิมพ์รายงาน
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> ส่งออก Excel
          </Button>
        </div>
      </div>

      <Card className="no-print">
        <CardHeader className="pb-3">
          <CardTitle>ตัวกรองข้อมูล</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ค้นหาตามรหัสหรือชื่อ..." className="pl-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList className="no-print">
          <TabsTrigger value="assets">ทะเบียนครุภัณฑ์ (Assets)</TabsTrigger>
          <TabsTrigger value="supplies">ทะเบียนพัสดุ (Supplies)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assets">
          <Card>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl">ทะเบียนคุมทรัพย์สิน (ครุภัณฑ์)</CardTitle>
              <CardDescription>หน่วยงาน: กองงานแผนและงบประมาณ</CardDescription>
            </CardHeader>
            <CardContent>
              <Table className="border">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="border text-center w-[80px]">ลำดับ</TableHead>
                    <TableHead className="border text-center">วัน/เดือน/ปี ที่ได้มา</TableHead>
                    <TableHead className="border">รหัสครุภัณฑ์</TableHead>
                    <TableHead className="border">รายการ (ชื่อ, ยี่ห้อ, ขนาด)</TableHead>
                    <TableHead className="border text-right">จำนวน</TableHead>
                    <TableHead className="border text-right">ราคาต่อหน่วย</TableHead>
                    <TableHead className="border">สถานที่เก็บ/ผู้รับผิดชอบ</TableHead>
                    <TableHead className="border">สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset, index) => (
                    <TableRow key={asset._id}>
                      <TableCell className="border text-center">{index + 1}</TableCell>
                      <TableCell className="border text-center">{new Date(asset.purchaseDate).toLocaleDateString('th-TH')}</TableCell>
                      <TableCell className="border font-mono">{asset.assetCode}</TableCell>
                      <TableCell className="border">{asset.name}</TableCell>
                      <TableCell className="border text-right">1</TableCell>
                      <TableCell className="border text-right font-mono">฿{asset.purchasePrice?.toLocaleString()}</TableCell>
                      <TableCell className="border">{asset.departmentId?.name}</TableCell>
                      <TableCell className="border text-center italic">{asset.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supplies">
          <Card>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl">บัตรทะเบียนพัสดุ (วัสดุ)</CardTitle>
              <CardDescription>ประเภท: วัสดุสำนักงาน</CardDescription>
            </CardHeader>
            <CardContent>
              <Table className="border">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="border text-center w-[80px]">ลำดับ</TableHead>
                    <TableHead className="border">รายการพัสดุ</TableHead>
                    <TableHead className="border">หน่วยนับ</TableHead>
                    <TableHead className="border text-right">จำนวนรับ</TableHead>
                    <TableHead className="border text-right">จำนวนจ่าย</TableHead>
                    <TableHead className="border text-right font-bold">คงเหลือ</TableHead>
                    <TableHead className="border">หมายเหตุ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplies.map((supply, index) => (
                    <TableRow key={supply._id}>
                      <TableCell className="border text-center">{index + 1}</TableCell>
                      <TableCell className="border font-medium">{supply.name}</TableCell>
                      <TableCell className="border">{supply.unit}</TableCell>
                      <TableCell className="border text-right">-</TableCell>
                      <TableCell className="border text-right">-</TableCell>
                      <TableCell className="border text-right font-bold text-lg">{supply.currentQuantity}</TableCell>
                      <TableCell className="border text-muted-foreground italic text-xs">
                        {supply.currentQuantity <= supply.minQuantity ? "ควรจัดซื้อเพิ่ม" : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; background: white; }
          .flex-1 { margin: 0; padding: 0; }
          .border { border-color: #000 !important; }
          .bg-muted/50 { background-color: #f1f1f1 !important; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}

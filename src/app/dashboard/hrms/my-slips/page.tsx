"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Download, 
  Eye, 
  Loader2,
  Calendar,
  Wallet,
  ArrowRight
} from "lucide-react"
// import { toast } from "sonner"
const toast = {
  error: (msg: string) => window.alert(msg),
  success: (msg: string) => window.alert(msg),
}
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function MySlipsPage() {
  const [slips, setSlips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMySlips = async () => {
      try {
        const res = await fetch("/api/salary-slips")
        const data = await res.json()
        setSlips(data)
      } catch (error) {
        toast.error("ไม่สามารถดึงข้อมูลสลิปได้")
      } finally {
        setLoading(false)
      }
    }
    fetchMySlips()
  }, [])

  const downloadPDF = (slip: any) => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(22)
    doc.setTextColor(79, 70, 229) // Indigo
    doc.text("สลิปเงินเดือน (Salary Slip)", 105, 20, { align: "center" })
    
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`งวดเดือน: ${slip.month}/${slip.year + 543}`, 105, 30, { align: "center" })
    
    // Employee Info
    doc.setDrawColor(200)
    doc.line(14, 40, 196, 40)
    
    doc.setTextColor(0)
    doc.setFontSize(10)
    doc.text(`ชื่อ-นามสกุล: ${slip.employeeId?.firstName} ${slip.employeeId?.lastName}`, 14, 50)
    doc.text(`รหัสพนักงาน: ${slip.employeeId?.employeeId}`, 14, 55)
    doc.text(`ตำแหน่ง: ${slip.employeeId?.position}`, 14, 60)
    
    // Table
    const tableData = slip.items.map((item: any) => [
      item.name,
      item.type === "EARNING" ? item.amount.toLocaleString() : "",
      item.type === "DEDUCTION" ? item.amount.toLocaleString() : ""
    ])
    
    autoTable(doc, {
      startY: 70,
      head: [["รายการ", "รายรับ (บาท)", "รายจ่าย (บาท)"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
      foot: [["รวมสุทธิ", "", `฿${slip.netSalary.toLocaleString()}`]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" }
    })
    
    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20
    doc.text("หมายเหตุ: สลิปนี้เป็นเอกสารอิเล็กทรอนิกส์ ไม่ต้องมีผู้ลงนาม", 105, finalY, { align: "center" })
    
    doc.save(`SalarySlip_${slip.month}_${slip.year + 543}.pdf`)
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">สลิปของฉัน</h2>
          <p className="text-muted-foreground mt-1">ประวัติสลิปเงินเดือนย้อนหลังทั้งหมดของคุณ</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <Wallet className="h-6 w-6 text-indigo-600" />
        </div>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {slips.map((slip) => (
            <Card key={slip._id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group">
              <CardHeader className="bg-indigo-600/5 pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <span className="font-bold text-indigo-950">เดือน {slip.month} / {slip.year + 543}</span>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">นำออกแล้ว</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">รายรับสุทธิ</span>
                    <span className="text-2xl font-black text-slate-800 tracking-tighter">฿{slip.netSalary.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-dashed pt-4">
                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">สรุปรายการ</p>
                    <div className="space-y-1">
                      {slip.items.slice(0, 3).map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-slate-600">{item.name}</span>
                          <span className={item.type === "EARNING" ? "text-emerald-600" : "text-rose-600"}>
                            {item.type === "EARNING" ? "+" : "-"}{item.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {slip.items.length > 3 && (
                        <p className="text-[10px] text-muted-foreground italic">...และอีก {slip.items.length - 3} รายการ</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 flex gap-2">
                <Button variant="outline" className="flex-1 gap-2 border-slate-200" onClick={() => downloadPDF(slip)}>
                  <Download className="h-3.5 w-3.5" /> PDF
                </Button>
                <Button className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <Eye className="h-3.5 w-3.5" /> ดูละเอียด
                </Button>
              </CardFooter>
            </Card>
          ))}
          {slips.length === 0 && (
            <Card className="col-span-full border-dashed p-12 flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-muted-foreground text-center">ยังไม่มีข้อมูลสลิปเงินเดือนของคุณในระบบ</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

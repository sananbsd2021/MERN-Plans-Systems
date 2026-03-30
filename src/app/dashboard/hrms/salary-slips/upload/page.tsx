"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  XCircle
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
// import { toast } from "sonner"
const toast = {
  error: (msg: string) => window.alert(msg),
  success: (msg: string) => window.alert(msg),
}

export default function SalaryUploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("โปรดเลือกไฟล์ก่อนนำเข้า")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("month", month.toString())
    formData.append("year", year.toString())

    try {
      const res = await fetch("/api/salary-slips/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        setResult(data)
        toast.success("นำเข้าข้อมูลสำเร็จ")
      } else {
        toast.error(data.message || "เกิดข้อผิดพลาดในการนำเข้า")
      }
    } catch (error) {
      console.error("Upload failed", error)
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/hrms/salary-slips">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">นำเข้าข้อมูลสลิปเงินเดือน</h2>
          <p className="text-muted-foreground mt-1">อัปโหลดไฟล์ Excel เพื่อสร้างสลิปเงินเดือนแบบกลุ่ม</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>เลือกไฟล์และระยะเวลา</CardTitle>
            <CardDescription>รูปแบบไฟล์ที่รองรับ: .xlsx, .xls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">เดือน</label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>เดือน {m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ปีงบประมาณ</label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>ปี {y + 543}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ไฟล์ Excel</label>
              <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer relative">
                <Input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <Upload className="h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-500 text-center">
                  {file ? file.name : "ลากและวางไฟล์ หรือคลิกเพื่อเลือกไฟล์"}
                </p>
              </div>
            </div>

            <Button 
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700" 
              onClick={handleUpload}
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> กำลังประมวลผล...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" /> เริ่มนำเข้าข้อมูล
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>คำแนะนำรูปแบบไฟล์</CardTitle>
            <CardDescription>โปรดจัดรูปแบบคอลัมน์ใน Excel ให้ถูกต้อง</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold">คอลัมน์รหัสพนักงาน</p>
                <p className="text-xs text-muted-foreground">ต้องมีคอลัมน์ชื่อ "รหัสพนักงาน" เพื่อเชื่อมโยงข้อมูล</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold">รายรับ (Earnings)</p>
                <p className="text-xs text-muted-foreground">ชื่อคอลัมน์ควรมีคำว่า: เงินเดือน, ค่าตอบแทน, โอที, โบนัส</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-rose-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold">รายจ่าย (Deductions)</p>
                <p className="text-xs text-muted-foreground">ชื่อคอลัมน์ควรมีคำว่า: ภาษี, ประกันสังคม, กองทุน, หัก</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card className="border-emerald-100 bg-emerald-50/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
               <CheckCircle2 className="h-5 w-5" /> ผลการนำเข้า
            </CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
          <CardContent>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-bold text-rose-700 flex items-center gap-2">
                  <XCircle className="h-4 w-4" /> พบข้อผิดพลาดบางรายการ:
                </p>
                <ul className="text-xs text-rose-600 list-disc ml-5 max-h-40 overflow-y-auto">
                  {result.errors.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-6 flex justify-end gap-2">
               <Button variant="outline" onClick={() => setResult(null)}>ล้างผลลัพธ์</Button>
               <Button onClick={() => router.push("/dashboard/hrms/salary-slips")}>ไปที่รายการสลิป</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

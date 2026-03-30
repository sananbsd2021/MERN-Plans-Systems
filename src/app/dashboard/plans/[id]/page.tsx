"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Calendar, FileText, Loader2, MapPin, ExternalLink, Activity } from "lucide-react"
import { PDFViewer } from "@/components/shared/pdf-viewer"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function PlanDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`/api/plans/${id}`)
        if (!res.ok) throw new Error("Failed to fetch plan")
        const data = await res.json()
        setPlan(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPlan()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold italic text-muted-foreground">ไม่พบข้อมูลแผนยุทธศาสตร์</h2>
        <Button onClick={() => router.push("/dashboard/plans")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> กลับหน้าหลัก
        </Button>
      </div>
    )
  }

  const totalProjectBudget = plan.projects?.reduce((acc: number, p: any) => acc + (p.budgetAllocated || 0), 0) || 0

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/plans" className={buttonVariants({ variant: "outline", size: "icon" })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">{plan.title}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={plan.status === "APPROVED" ? "default" : "outline"} className="bg-primary/10 text-primary border-primary/20">
                {plan.status}
              </Badge>
              <span>•</span>
              <Calendar className="h-3 w-3" />
              <span>{new Date(plan.startDate).toLocaleDateString('th-TH')} - {new Date(plan.endDate).toLocaleDateString('th-TH')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {plan.pdfUrl && (
            <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5" onClick={() => setPdfDialogOpen(true)}>
              <FileText className="h-4 w-4" /> ดูเอกสารแนบ
            </Button>
          )}
          <Link href="/dashboard/projects" className={buttonVariants({ variant: "secondary", className: "gap-2" })}>
            <Activity className="h-4 w-4" /> บริหารโครงการ
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/10 bg-gradient-to-br from-white to-primary/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">งบประมาณโครงการรวม</CardTitle>
            <div className="rounded-full bg-primary/10 p-2 text-primary">฿</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">฿{totalProjectBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">จากโครงการทั้งหมดที่ผูกมัด</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10 bg-gradient-to-br from-white to-blue-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">โครงการในสังกัด</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plan.projects?.length || 0} โครงการ</div>
            <p className="text-xs text-muted-foreground mt-1">กระจายตามพื้นที่ดูแล</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10 bg-gradient-to-br from-white to-amber-50/50 shadow-sm col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ความคืบหน้าภาพรวม</CardTitle>
            <div className="rounded-full bg-amber-100 p-2 text-amber-600">%</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold italic text-muted-foreground">รอการวิเคราะห์ AI</div>
            <p className="text-xs text-muted-foreground mt-1">อ้างอิงสถานะโครงการล่าสุด</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 border-primary/5">
          <CardHeader>
            <CardTitle>รายการโครงการที่เกี่ยวข้อง</CardTitle>
            <CardDescription>โครงการทั้งหมดที่อยู่ภายใต้ยุทธศาสตร์นี้</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อโครงการ</TableHead>
                  <TableHead>งบประมาณ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">ดูข้อมูล</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.projects?.map((project: any) => (
                  <TableRow key={project._id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{project.name}</span>
                        {project.location && (
                          <div className="flex items-center gap-1 text-[10px] text-primary">
                            <MapPin className="h-2 w-2" /> {project.location.coordinates[1]}, {project.location.coordinates[0]}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">฿{project.budgetAllocated?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={project.status === "COMPLETED" ? "default" : "secondary"} className="text-[10px]">
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link 
                        href="/dashboard/projects" 
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity")}
                      >
                        <ExternalLink className="h-4 w-4 text-primary" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {(!plan.projects || plan.projects.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      ยังไม่มีโครงการภายใต้ยุทธศาสตร์นี้
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-primary/5">
          <CardHeader>
            <CardTitle>คำอธิบาย/วิสัยทัศน์</CardTitle>
            <CardDescription>ข้อมูลรายละเอียดของแผนงาน</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground italic">
              {plan.description || "ไม่มีข้อมูลคำอธิบาย"}
            </div>
            
            <div className="pt-4 border-t space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> เอกสารอ้างอิง
              </h4>
              {plan.pdfUrl ? (
                <div className="flex items-center justify-between rounded-md border border-primary/10 p-3 bg-primary/5">
                   <div className="flex items-center gap-3 overflow-hidden">
                     <FileText className="h-8 w-8 text-primary shrink-0" />
                     <div className="flex flex-col overflow-hidden">
                       <span className="text-xs font-medium truncate">{plan.pdfUrl.split('/').pop()}</span>
                       <span className="text-[10px] text-muted-foreground uppercase">Official Document</span>
                     </div>
                   </div>
                   <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10" onClick={() => setPdfDialogOpen(true)}>
                     เปิดดู
                   </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic px-2">ยังไม่ได้อัปโหลดเอกสารประกอบแผน</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <PDFViewer 
        url={plan.pdfUrl} 
        isOpen={pdfDialogOpen} 
        onClose={() => setPdfDialogOpen(false)} 
        title={`แผนยุทธศาสตร์: ${plan.title}`}
      />
    </div>
  )
}

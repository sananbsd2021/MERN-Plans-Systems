"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Loader2, 
  LayoutGrid, 
  Target, 
  Wallet, 
  AlertCircle, 
  Calendar, 
  ChevronRight, 
  Info 
} from "lucide-react"
import { BudgetTrendChart } from "@/components/charts/budget-trend-chart"
import dynamic from "next/dynamic"

const ProjectMap = dynamic(() => import("@/components/layout/project-map"), { 
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted rounded-md" />
})

import { AttendanceCard } from "@/components/hrms/attendance-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/overview")
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const stats = [
    { 
      title: "งบประมาณทั้งหมด", 
      value: `฿${(data?.totalBudget || 0).toLocaleString()}`, 
      icon: Wallet, 
      color: "text-blue-600", 
      bg: "bg-blue-50", 
      description: "งบประมาณสะสมปีปัจจุบัน" 
    },
    { 
      title: "โครงการที่ดำเนินการ", 
      value: `${data?.activeProjects || 0} โครงการ`, 
      icon: LayoutGrid, 
      color: "text-indigo-600", 
      bg: "bg-indigo-50", 
      description: "โครงการที่อยู่ระหว่างการดำเนินการ" 
    },
    { 
      title: "เป้าหมาย KPI (Achievement)", 
      value: `${(data?.avgKpiSuccess || 0).toFixed(1)}%`, 
      icon: Target, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50", 
      description: "ค่าเฉลี่ยความสำเร็จทุกตัวชี้วัด" 
    },
    { 
      title: "การแจ้งเตือนวิกฤต", 
      value: `${data?.criticalAlerts || 0} รายการ`, 
      icon: AlertCircle, 
      color: "text-rose-600", 
      bg: "bg-rose-50", 
      description: "รายการที่ต้องเร่งแก้ไขด่วน" 
    },
  ]

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-slate-50/30 min-h-screen">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
          <p className="text-muted-foreground text-sm mt-1">ภาพรวมการดำเนินงานและสถานะทางการเงินขององค์กร</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
           <Badge variant="outline" className="bg-white shadow-sm py-1.5 px-3 border-slate-200">
             <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
             ประจำปีงบประมาณ {new Date().getFullYear() + 543}
           </Badge>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              duration: 0.4,
              delay: i * 0.1,
              ease: [0.23, 1, 0.32, 1]
            }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 group bg-white/70 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {stat.title}
                </CardTitle>
                <div className={cn(
                  "p-2.5 rounded-xl transition-all duration-500 group-hover:rotate-12 group-hover:shadow-inner", 
                  stat.bg
                )}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tracking-tighter text-slate-800 drop-shadow-sm">{stat.value}</div>
                <div className="flex items-center gap-1.5 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                   <div className={cn("h-1 w-1 rounded-full", stat.color.replace('text', 'bg'))} />
                   <p className="text-[10px] text-muted-foreground font-semibold">
                     {stat.description}
                   </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>แนวโน้มการเบิกจ่าย (Budget Trends)</CardTitle>
            <CardDescription>การเปรียบเทียบงบประมาณที่ได้รับและมูลค่าการเบิกจ่ายจริงรายกองงาน</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 pb-6">
            <BudgetTrendChart />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle>โครงการล่าสุด</CardTitle>
            <CardDescription>รายการล่าสุดที่ถูกบันทึกเข้าสู่ระบบ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(data?.recentProjects || []).map((project: any, i: number) => (
                <motion.div 
                  key={project._id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1), ease: "easeOut" }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 group cursor-pointer p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary group-hover:rotate-6 transition-all duration-300 shadow-sm">
                    <LayoutGrid className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-black truncate text-slate-700 group-hover:text-primary transition-colors">{project.name}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Wallet className="h-3 w-3 text-emerald-500" />
                        <span className="text-[11px] font-bold text-slate-600">
                          ฿{project.budgetAllocated?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {new Date(project.createdAt).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-primary/10 transition-all">
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </div>
                </motion.div>
              ))}
              
              {(!data?.recentProjects || data.recentProjects.length === 0) && (
                <div className="text-center py-10">
                   <p className="text-xs text-muted-foreground italic">ไม่มีข้อมูลโครงการล่าสุด</p>
                </div>
              )}
            </div>
            
            <Link href="/dashboard/projects" className="block w-full mt-6">
              <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 border border-dashed border-slate-200 rounded-xl py-6">
                ดูโครงการทั้งหมด <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 overflow-hidden border-none shadow-sm h-[480px] relative">
          <CardHeader className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100">
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle className="text-base font-bold text-slate-800">ขอบเขตพื้นที่ดำเนินงาน (Project Map)</CardTitle>
                  <CardDescription className="text-[11px]">พิกัดทางภูมิศาสตร์ของโครงการพัฒนาที่ระบุตำแหน่งแล้ว</CardDescription>
               </div>
               <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-2" />
                  LIVE METRICS
               </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-full pt-[72px]">
            <ProjectMap />
          </CardContent>
        </Card>

        <AttendanceCard />
      </div>
    </div>
  )
}

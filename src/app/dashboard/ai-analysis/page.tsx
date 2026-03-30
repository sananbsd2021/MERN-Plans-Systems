"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Loader2, 
  Sparkles, 
  AlertTriangle, 
  Target, 
  CheckCircle2, 
  Info, 
  TrendingUp, 
  LineChart, 
  Wallet, 
  ShieldCheck,
  Award,
  FileText,
  Star
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function AIAnalysisPage() {
  const [budgets, setBudgets] = useState<any[]>([])
  const [kpis, setKpis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Risk Assessment States
  const [selectedBudgetId, setSelectedBudgetId] = useState("")
  const [selectedKpiId, setSelectedKpiId] = useState("")
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)

  // Forecasting States
  const [forecastType, setForecastType] = useState<"budget" | "kpi">("budget")
  const [forecastResult, setForecastResult] = useState<any>(null)
  const [forecasting, setForecasting] = useState(false)

  // Executive Insights States
  const [executiveResult, setExecutiveResult] = useState<any>(null)
  const [fetchingExecutive, setFetchingExecutive] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [bRes, kRes] = await Promise.all([
        fetch("/api/budget"),
        fetch("/api/kpi")
      ])
      if (bRes.ok) setBudgets(await bRes.json())
      if (kRes.ok) setKpis(await kRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const runAnalysis = async () => {
    if (!selectedBudgetId && !selectedKpiId) return
    setAnalyzing(true)
    setAnalysisResult(null)
    
    try {
      const type = selectedBudgetId ? "budget" : "kpi"
      const id = selectedBudgetId || selectedKpiId
      const endpoint = type === "budget" ? "/api/ai/budget-analysis" : "/api/ai/kpi-analysis"
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      if (res.ok) setAnalysisResult(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setAnalyzing(false)
    }
  }

  const runForecasting = async () => {
    setForecasting(true)
    setForecastResult(null)
    try {
      const res = await fetch("/api/ai/trend-forecasting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: forecastType })
      })
      if (res.ok) setForecastResult(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setForecasting(false)
    }
  }

  const fetchExecutiveInsights = async () => {
    setFetchingExecutive(true)
    setExecutiveResult(null)
    try {
      const res = await fetch("/api/ai/executive-insights")
      if (res.ok) setExecutiveResult(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setFetchingExecutive(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Insights & Analysis</h2>
          <p className="text-muted-foreground text-sm mt-1">ใช้พลังของ Gemini AI เพื่อวิเคราะห์ความเสี่ยงและแนวโน้มขององค์กร</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
           <Sparkles className="h-4 w-4 fill-current" />
           <span className="text-xs font-bold uppercase tracking-wider">Gemini 1.5 Powered</span>
        </div>
      </div>

      <Tabs defaultValue="risk-assessment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:max-w-[600px]">
          <TabsTrigger value="risk-assessment" className="gap-2">
            <ShieldCheck className="h-4 w-4" /> วิเคราะห์ความเสี่ยง
          </TabsTrigger>
          <TabsTrigger value="forecasting" className="gap-2">
            <LineChart className="h-4 w-4" /> พยากรณ์แนวโน้ม
          </TabsTrigger>
          <TabsTrigger value="executive" className="gap-2">
            <Award className="h-4 w-4 text-amber-500" /> สรุปผู้บริหาร
          </TabsTrigger>
        </TabsList>

        <TabsContent value="risk-assessment" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-800 uppercase flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> งบประมาณเสี่ยงสูง
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {budgets.filter(b => b.riskLevel === "HIGH").length} รายการ
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">จากทั้งหมด {budgets.length} หน่วยงาน</p>
                </CardContent>
             </Card>
             <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-800 uppercase flex items-center gap-2">
                    <Target className="h-4 w-4" /> KPI ต่ำกว่าเกณฑ์
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">
                    {kpis.filter(k => (k.currentValue / k.targetValue) < 0.7).length} รายการ
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">เสี่ยงไม่บรรลุเป้าหมายตามแผน</p>
                </CardContent>
             </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>เลือกรายการเพื่อวิเคราะห์</CardTitle>
                <CardDescription>วิเคราะห์ความเสี่ยงรายรายการเชิงลึกด้วย AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase font-bold tracking-widest">โครงการ / งบประมาณ</Label>
                    <Select value={selectedBudgetId} onValueChange={(v) => { setSelectedBudgetId(v || ""); setSelectedKpiId(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกหน่วยงาน/งบประมาณ" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgets.map(b => (
                          <SelectItem key={b._id} value={b._id}>{b.department} ({b.year})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
                 
                 <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">หรือ</span></div>
                 </div>

                 <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase font-bold tracking-widest">ตัวชี้วัด (KPI)</Label>
                    <Select value={selectedKpiId} onValueChange={(v) => { setSelectedKpiId(v || ""); setSelectedBudgetId(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกตัวชี้วัดโครงการ" />
                      </SelectTrigger>
                      <SelectContent>
                        {kpis.map(k => (
                          <SelectItem key={k._id} value={k._id}>{k.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>

                 <Button 
                   className="w-full shadow-lg" 
                   size="lg"
                   onClick={runAnalysis} 
                   disabled={analyzing || (!selectedBudgetId && !selectedKpiId)}
                 >
                   {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                   {analyzing ? "กำลังประมวลผล..." : "รัน AI วิเคราะห์"}
                 </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-4 overflow-hidden relative border-none shadow-xl">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 via-white to-indigo-50/50 -z-10" />
               <CardHeader className="border-b bg-white/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>ผลการวิเคราะห์ AI</CardTitle>
                      <CardDescription>ข้อเสนอแนะและมาตรการแก้ไขเชิงกลยุทธ์</CardDescription>
                    </div>
                    {analysisResult && (
                      <Badge className={cn(
                        "px-3 py-1 text-xs font-bold",
                        analysisResult.riskLevel === "HIGH" ? "bg-red-500 hover:bg-red-600" :
                        analysisResult.riskLevel === "MEDIUM" ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"
                      )}>
                        {analysisResult.riskLevel} RISK
                      </Badge>
                    )}
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  {!analysisResult && !analyzing ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                       <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center">
                          <Target className="h-8 w-8 opacity-20" />
                       </div>
                       <p className="text-sm max-w-[200px]">เลือกรายการด้านซ้ายและกดรัน AI เพื่อดูผลการวิเคราะห์</p>
                    </div>
                  ) : analyzing ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-4 animate-pulse">
                        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                        <p className="text-sm font-medium text-muted-foreground">Gemini กำลังประมวลผลข้อมูลมหาศาล...</p>
                    </div>
                  ) : (
                    <div className="p-6 space-y-6">
                       <div className="space-y-2">
                         <h4 className="text-xs font-bold uppercase text-primary tracking-widest flex items-center gap-2">
                           <Info className="h-3 w-3" /> บทสรุปผู้บริหาร
                         </h4>
                         <p className="text-sm leading-relaxed text-slate-700 font-medium">
                           {analysisResult.summary || analysisResult.analysis}
                         </p>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                             <h5 className="text-[10px] font-bold text-emerald-800 uppercase mb-2 flex items-center gap-1">
                               <CheckCircle2 className="h-3 w-3" /> ข้อเสนอแนะแนวทางแก้ไข
                             </h5>
                             <ul className="text-[11px] space-y-2 text-emerald-900 list-disc pl-4 font-medium">
                               {(analysisResult.recommendations || []).map((r: string, idx: number) => (
                                 <li key={idx}>{r}</li>
                               ))}
                             </ul>
                          </div>
                          <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                             <h5 className="text-[10px] font-bold text-red-800 uppercase mb-2 flex items-center gap-1">
                               <AlertTriangle className="h-3 w-3" /> จุดเสี่ยงที่ควรเฝ้าระวัง
                             </h5>
                             <ul className="text-[11px] space-y-2 text-red-900 list-disc pl-4 font-medium">
                               {(analysisResult.warnings || analysisResult.issues || []).map((w: string, idx: number) => (
                                 <li key={idx}>{w}</li>
                               ))}
                             </ul>
                          </div>
                       </div>
                    </div>
                  )}
               </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>ระบบคาดการณ์แนวโน้ม</CardTitle>
                <CardDescription>วิเคราะห์แนวโน้มข้อมูลในภาพรวมเพื่อการวางแผนล่วงหน้า</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase font-bold tracking-widest">ประเภทข้อมูล</Label>
                    <div className="grid grid-cols-2 gap-2">
                       <button 
                         onClick={() => setForecastType("budget")}
                         className={cn(
                           "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                           forecastType === "budget" ? "border-primary bg-primary/5 text-primary" : "border-muted hover:border-muted-foreground/30"
                         )}
                       >
                         <Wallet className="h-6 w-6" />
                         <span className="text-xs font-bold font-mono uppercase">Budgeting</span>
                       </button>
                       <button 
                         onClick={() => setForecastType("kpi")}
                         className={cn(
                           "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                           forecastType === "kpi" ? "border-primary bg-primary/5 text-primary" : "border-muted hover:border-muted-foreground/30"
                         )}
                       >
                         <Target className="h-6 w-6" />
                         <span className="text-xs font-bold font-mono uppercase">Performance</span>
                       </button>
                    </div>
                 </div>

                 <Button 
                   className="w-full shadow-lg" 
                   size="lg"
                   variant="default"
                   onClick={runForecasting} 
                   disabled={forecasting}
                 >
                   {forecasting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
                   {forecasting ? "กำลังคำนวณ..." : "รัน AI พยากรณ์"}
                 </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-4 overflow-hidden relative border-none shadow-xl min-h-[400px]">
               <div className="absolute inset-0 bg-gradient-to-tr from-purple-50/50 via-white to-blue-50/50 -z-10" />
               <CardHeader className="border-b bg-white/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>AI Trend Forecast</CardTitle>
                      <CardDescription>ผลคาดการณ์และทิศทางในอนาคต</CardDescription>
                    </div>
                    {forecastResult && (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Confidence</span>
                        <div className="flex items-center gap-2">
                           <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${forecastResult.confidence}%` }} />
                           </div>
                           <span className="text-xs font-bold font-mono">{forecastResult.confidence}%</span>
                        </div>
                      </div>
                    )}
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  {!forecastResult && !forecasting ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4 py-20">
                       <LineChart className="h-12 w-12 opacity-10" />
                       <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-400">ยังไม่มีข้อมูลแนวโน้ม</p>
                          <p className="text-xs max-w-[240px]">ระบบจะรวบรวมข้อมูล {forecastType === "budget" ? "งบประมาณทุกหน่วยงาน" : "KPI ทุกโครงการ"} มาทำการวิเคราะห์แบบองค์รวมด้วย AI</p>
                       </div>
                    </div>
                  ) : forecasting ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-4 animate-pulse py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                        <p className="text-sm font-medium text-slate-500">Gemini กำลังวิเคราะห์แนวโน้มข้อมูลจากฐานข้อมูล...</p>
                    </div>
                  ) : (
                    <div className="p-6 space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                             <h4 className="text-xs font-bold uppercase text-slate-500 tracking-widest flex items-center gap-2">
                               <TrendingUp className="h-3 w-3" /> บทสรุปแนวโน้ม
                             </h4>
                             <p className="text-sm leading-relaxed text-slate-700 font-medium">
                               {forecastResult.trendSummary}
                             </p>
                          </div>
                          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl text-center flex flex-col items-center justify-center">
                             <h5 className="text-[10px] font-bold text-primary uppercase mb-1">
                               พยากรณ์ล่วงหน้า
                             </h5>
                             <div className="text-xl font-black text-primary font-mono tracking-tighter">
                               {forecastResult.forecastValue}
                             </div>
                             <p className="text-[9px] text-muted-foreground mt-1 tracking-tight">จากการคำนวณเชิงสถิติโดย AI</p>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase text-slate-500 tracking-widest">Strategic Advice</h4>
                          <div className="grid gap-3">
                             {forecastResult.recommendations.map((rec: string, i: number) => (
                               <div key={i} className="flex gap-3 p-3 bg-white rounded-lg border shadow-sm">
                                  <div className="h-5 w-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {i + 1}
                                  </div>
                                  <p className="text-xs font-medium text-slate-600 leading-normal">{rec}</p>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-3 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                          <h4 className="text-[10px] font-black uppercase text-amber-700 tracking-widest flex items-center gap-2">
                             <AlertTriangle className="h-3 w-3" /> จุดที่ต้องเฝ้าระวังเป็นพิเศษ
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                             {forecastResult.risks.map((risk: string, i: number) => (
                               <div key={i} className="flex items-center gap-2 text-[11px] font-medium text-amber-900">
                                  <div className="w-1 h-1 rounded-full bg-amber-500" />
                                  {risk}
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}
               </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="executive" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-12">
            <Card className="md:col-span-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none shadow-2xl relative overflow-hidden h-fit">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Award className="h-32 w-32" />
               </div>
               <CardHeader>
                 <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-400 fill-amber-400" />
                    Strategic AI Advisor
                 </CardTitle>
                 <CardDescription className="text-indigo-200">ระบบประมวลผลกลยุทธ์ขั้นสูงเพื่อผู้บริหารสูงสุด</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6 relative z-10">
                  <p className="text-sm leading-relaxed text-indigo-100/80">
                    Gemini AI จะทำการประมวลผลข้อมูลมหาศาลจากทั้งงบประมาณ ตัวชี้วัด และความคืบหน้าโครงการทั้งหมด เพื่อสังเคราะห์ออกมาเป็นแนวทางยุทธศาสตร์ที่เฉียบคมที่สุดสำหรับองค์กรของคุณ
                  </p>
                  <Button 
                    variant="secondary" 
                    className="w-full bg-white text-indigo-900 hover:bg-amber-400 hover:text-amber-950 transition-all font-bold py-6 group"
                    onClick={fetchExecutiveInsights}
                    disabled={fetchingExecutive}
                  >
                    {fetchingExecutive ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Award className="mr-2 h-5 w-5 group-hover:scale-125 transition-transform" />}
                    {fetchingExecutive ? "กำลังวิเคราะห์ระดับสูง..." : "สร้างรายงานกลยุทธ์ AI"}
                  </Button>
               </CardContent>
            </Card>

            <div className="md:col-span-8 space-y-6">
               {!executiveResult && !fetchingExecutive ? (
                 <Card className="border-dashed border-2 py-20 bg-slate-50/50">
                    <CardContent className="flex flex-col items-center justify-center text-center gap-4">
                       <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border flex items-center justify-center">
                          <FileText className="h-8 w-8 text-slate-300" />
                       </div>
                       <div className="space-y-1">
                          <h4 className="font-bold text-slate-500">พร้อมสำหรับการวิเคราะห์</h4>
                          <p className="text-xs text-muted-foreground">กดปุ่มวิเคราะห์ด้านซ้ายเพื่อรับข้อมูลเชิงกลยุทธ์สำหรับผู้บริหาร</p>
                       </div>
                    </CardContent>
                 </Card>
               ) : fetchingExecutive ? (
                 <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="animate-pulse bg-slate-50 h-[120px]" />
                    ))}
                 </div>
               ) : (
                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Executive Summary */}
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                       <div className="h-1 bg-amber-500 w-full" />
                       <CardHeader className="pb-2">
                         <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                               <Info className="h-4 w-4 text-amber-500" /> Executive Summary
                            </CardTitle>
                            <div className="flex flex-col items-end">
                               <span className="text-[10px] font-bold text-slate-400 uppercase">Efficiency Score</span>
                               <div className="text-2xl font-black text-amber-600 font-mono leading-none">{executiveResult.score}</div>
                            </div>
                         </div>
                       </CardHeader>
                       <CardContent>
                          <p className="text-lg font-medium text-slate-700 leading-relaxed italic">
                            "{executiveResult.executiveSummary}"
                          </p>
                       </CardContent>
                    </Card>

                    {/* Strategic Priorities */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {executiveResult.strategicPriorities.map((p: any, i: number) => (
                         <Card key={i} className="border-none shadow-md group hover:shadow-indigo-100 hover:shadow-lg transition-all">
                            <CardHeader className="p-4 pb-0">
                               <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                  {i === 0 ? <Target className="h-4 w-4" /> : i === 1 ? <TrendingUp className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                               </div>
                               <CardTitle className="text-sm font-bold text-slate-800">{p.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                               <p className="text-xs text-slate-500 leading-normal">{p.description}</p>
                            </CardContent>
                         </Card>
                       ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Structural Risks */}
                       <Card className="border-none shadow-sm bg-rose-50/30 border-rose-100">
                          <CardHeader className="pb-2">
                             <CardTitle className="text-xs font-bold uppercase text-rose-700 tracking-widest flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3" /> Structural Risks
                             </CardTitle>
                          </CardHeader>
                          <CardContent>
                             <ul className="space-y-3">
                                {executiveResult.structuralRisks.map((risk: string, i: number) => (
                                  <li key={i} className="flex gap-3 text-xs font-medium text-rose-900/70">
                                     <div className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                     {risk}
                                  </li>
                                ))}
                             </ul>
                          </CardContent>
                       </Card>

                       {/* Future Planning */}
                       <Card className="border-none shadow-sm bg-emerald-50/30 border-emerald-100">
                          <CardHeader className="pb-2">
                             <CardTitle className="text-xs font-bold uppercase text-emerald-700 tracking-widest flex items-center gap-2">
                                <Star className="h-3 w-3" /> Future Planning Advice
                             </CardTitle>
                          </CardHeader>
                          <CardContent>
                             <p className="text-xs font-medium text-emerald-900/70 leading-relaxed">
                                {executiveResult.futurePlanning}
                             </p>
                          </CardContent>
                       </Card>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

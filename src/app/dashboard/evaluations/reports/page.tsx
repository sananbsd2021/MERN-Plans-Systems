"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Award, AlertTriangle, TrendingUp, Users, CheckCircle2 } from "lucide-react"

export default function EvaluationsReportPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("/api/evaluations?role=MANAGER")
        if (res.ok) {
          const evals = await res.json()
          
          const completedEvals = evals.filter((e: any) => e.status === "COMPLETED" && e.totalScore !== undefined)
          const avgScore = completedEvals.length > 0 
            ? completedEvals.reduce((acc: number, curr: any) => acc + curr.totalScore, 0) / completedEvals.length 
            : 0

          const sortedEvals = [...completedEvals].sort((a,b) => b.totalScore - a.totalScore)
          const topPerformers = sortedEvals.slice(0, 3)
          // For needs improvement, we reverse sort to get lowest scores
          const needsImprovement = [...completedEvals].sort((a,b) => a.totalScore - b.totalScore).slice(0, 3)

          // Mock distribution data
          const distribution = [
            { name: "0-50", count: completedEvals.filter((e: any) => e.totalScore <= 50).length },
            { name: "51-70", count: completedEvals.filter((e: any) => e.totalScore > 50 && e.totalScore <= 70).length },
            { name: "71-85", count: completedEvals.filter((e: any) => e.totalScore > 70 && e.totalScore <= 85).length },
            { name: "86-100", count: completedEvals.filter((e: any) => e.totalScore > 85).length },
          ]

          setData({
            total: evals.length,
            completed: completedEvals.length,
            avgScore,
            topPerformers,
            needsImprovement,
            distribution
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  if (loading) return <div className="p-12 text-center text-slate-500">กำลังโหลดรายงาน...</div>
  if (!data) return <div className="p-12 text-center text-red-500">ไม่สามารถโหลดข้อมูลรายงานได้</div>

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 mb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">รายงานผลการประเมินประจำรอบ</h1>
        <p className="text-slate-500 mt-1">ภาพรวมและข้อมูลเชิงสถิติ (Analytics) สำหรับฝ่ายจัดการ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl"><Users className="w-7 h-7" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">การประเมินทั้งหมดในทีม</p>
            <p className="text-3xl font-bold text-slate-800">{data.total} <span className="text-sm font-normal text-slate-500">รายการ</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl"><CheckCircle2 className="w-7 h-7" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">ประเมินเสร็จสิ้นแล้ว</p>
            <p className="text-3xl font-bold text-slate-800">{data.completed} <span className="text-sm font-normal text-slate-500">รายการ</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="bg-amber-50 text-amber-600 p-4 rounded-2xl"><TrendingUp className="w-7 h-7" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">คะแนนประเมินเฉลี่ย</p>
            <p className="text-3xl font-bold text-slate-800">{data.avgScore.toFixed(2)} <span className="text-sm font-normal text-slate-500">/ 100</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-500 rounded-full"></div> การกระจายตัวของคะแนนประเมิน (Score Distribution)
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="จำนวนคน" barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[calc(50%-12px)] overflow-hidden flex flex-col">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> พนักงานดีเด่น (Top Performers)
            </h2>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              {data.topPerformers.length > 0 ? data.topPerformers.map((e: any, i: number) => (
                <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">{e.employeeId?.firstName} {e.employeeId?.lastName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{e.employeeId?.position}</p>
                  </div>
                  <span className="font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg text-xs shadow-sm">
                    {e.totalScore.toFixed(2)}
                  </span>
                </div>
              )) : <p className="text-sm text-slate-400 m-auto">ยังไม่มีข้อมูลที่คำนวณได้</p>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[calc(50%-12px)] overflow-hidden flex flex-col">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" /> รับการพัฒนาเพิ่มเติม (Needs Improvement)
            </h2>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              {data.needsImprovement.length > 0 ? data.needsImprovement.map((e: any, i: number) => (
                <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">{e.employeeId?.firstName} {e.employeeId?.lastName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{e.employeeId?.position}</p>
                  </div>
                  <span className="font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg text-xs shadow-sm">
                    {e.totalScore.toFixed(2)}
                  </span>
                </div>
              )) : <p className="text-sm text-slate-400 m-auto">ยังไม่มีข้อมูลที่คำนวณได้</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

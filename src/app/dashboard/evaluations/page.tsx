"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ClipboardList, Users, CheckCircle, Clock, Plus } from "lucide-react"
import { useSession } from "next-auth/react"

export default function EvaluationsDashboard() {
  const { data: session } = useSession()
  const isExecutiveOrAdmin = ["EXECUTIVE", "ADMIN", "SUPER_ADMIN"].includes(session?.user?.role as string)
  
  const [myEvaluations, setMyEvaluations] = useState<any[]>([])
  const [teamEvaluations, setTeamEvaluations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const [selfRes, teamRes] = await Promise.all([
          fetch("/api/evaluations?role=SELF"),
          fetch("/api/evaluations?role=MANAGER")
        ])
        
        if (selfRes.ok) setMyEvaluations(await selfRes.json())
        if (teamRes.ok) setTeamEvaluations(await teamRes.json())
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchEvaluations()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium border border-yellow-200">รอประเมินตนเอง</span>
      case "SELF_ASSESSED": return <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">รอหัวหน้าประเมิน</span>
      case "SUPERVISOR_EVALUATED": return <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium border border-purple-200">รอการอนุมัติ</span>
      case "COMPLETED": return <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200">เสร็จสิ้น</span>
      default: return null
    }
  }

  if (loading) return <div className="p-6 text-center text-slate-500">กำลังโหลดข้อมูล...</div>

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ระบบประเมินการปฏิบัติงาน</h1>
          <p className="text-slate-500 mt-1">จัดการและติดตามผลการประเมินประจำรอบอย่างโปร่งใส เป็นธรรม</p>
        </div>
        
        {isExecutiveOrAdmin && (
          <Link href="/dashboard/evaluations/new" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 font-medium">
            <Plus className="w-5 h-5" />
            สร้างการประเมินใหม่
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Evaluations */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">การประเมินของฉัน</h2>
              <p className="text-sm text-slate-500">แบบประเมินสำหรับตัวท่านเอง</p>
            </div>
          </div>
          
          {myEvaluations.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-500">ยังไม่มีรอบการประเมินของคุณ</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myEvaluations.map(evalDoc => (
                <Link key={evalDoc._id} href={`/dashboard/evaluations/${evalDoc._id}`}>
                  <div className="block p-5 rounded-2xl border border-slate-100 hover:border-sky-300 hover:bg-sky-50/30 hover:shadow-md hover:shadow-sky-100 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-slate-800 group-hover:text-sky-700 transition-colors">{evalDoc.periodId?.name}</h3>
                      {getStatusBadge(evalDoc.status)}
                    </div>
                    <div className="text-sm text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1">ผู้ประเมิน: <span className="font-medium text-slate-700">{evalDoc.evaluatorId?.name || "-"}</span></span>
                      {evalDoc.totalScore !== undefined && evalDoc.status === 'COMPLETED' && (
                        <span className="font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-lg">คะแนน: {evalDoc.totalScore.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Team Evaluations (If Manager) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">ประเมินทีมงาน</h2>
              <p className="text-sm text-slate-500">รายการประเมินที่รอท่านเป็นผู้พิจารณา</p>
            </div>
          </div>
          
          {teamEvaluations.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-500">ไม่มีรายการที่ต้องประเมิน</p>
            </div>
          ) : (
             <div className="space-y-4">
              {teamEvaluations.map(evalDoc => (
                <Link key={evalDoc._id} href={`/dashboard/evaluations/${evalDoc._id}`}>
                  <div className="block p-5 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md hover:shadow-indigo-100 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                       <h3 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                         {evalDoc.employeeId?.firstName} {evalDoc.employeeId?.lastName}
                       </h3>
                      {getStatusBadge(evalDoc.status)}
                    </div>
                    <div className="text-sm text-slate-500 flex justify-between">
                      <span className="font-medium text-slate-600">{evalDoc.employeeId?.position}</span>
                      <span className="bg-slate-100 px-2 rounded-lg py-0.5">{evalDoc.periodId?.name}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

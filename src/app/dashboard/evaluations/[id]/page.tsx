"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Save, Sparkles, CheckCircle2, ChevronLeft, AlertCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

export default function EvaluationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const isExecutiveOrAdmin = ["EXECUTIVE", "ADMIN", "SUPER_ADMIN"].includes(session?.user?.role as string)

  const [evaluation, setEvaluation] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/evaluations/${id}`)
      if (res.ok) {
        const data = await res.json()
        setEvaluation(data)
        setItems(data.items || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: Number(value) }
    setItems(newItems)
  }

  const handleCommentChange = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSave = async (status: string) => {
    setSaving(true)
    try {
      const payload = {
        status,
        items: items.map(item => ({
          kpiId: item.kpiId?._id || item.kpiId,
          selfScore: item.selfScore,
          supervisorScore: item.supervisorScore,
          selfComment: item.selfComment,
          supervisorComment: item.supervisorComment
        }))
      }
      
      const res = await fetch(`/api/evaluations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateAI = async () => {
    setGeneratingAI(true)
    try {
      const res = await fetch(`/api/ai/evaluation-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationId: id })
      })
      if (res.ok) {
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบการประเมินนี้ทิ้ง?")) return;
    try {
      const res = await fetch(`/api/evaluations/${id}`, { method: "DELETE" })
      if (res.ok) router.push("/dashboard/evaluations")
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="p-12 text-center text-slate-500">กำลังโหลดข้อมูล...</div>
  if (!evaluation) return <div className="p-12 text-center text-red-500">ไม่พบข้อมูลการประเมิน</div>

  const isSelfAssessed = evaluation.status === "SELF_ASSESSED" || evaluation.status === "SUPERVISOR_EVALUATED" || evaluation.status === "COMPLETED";
  const isCompleted = evaluation.status === "COMPLETED";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 mb-20">
      <Link href="/dashboard/evaluations" className="text-slate-500 hover:text-blue-600 flex items-center gap-1 w-fit mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> ย้อนกลับ
      </Link>
      
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            แบบประเมินผลงาน: {evaluation.employeeId?.firstName} {evaluation.employeeId?.lastName}
          </h1>
          <div className="flex gap-4 text-sm text-slate-500">
            <span>ตำแหน่ง: {evaluation.employeeId?.position}</span>
            <span>รอบประเมิน: {evaluation.periodId?.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-medium border border-blue-100 flex items-center gap-2">
             สถานะ: {evaluation.status}
          </div>
          {isExecutiveOrAdmin && (
            <button onClick={handleDelete} className="bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 p-2.5 rounded-xl border border-rose-100 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Items */}
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{item.kpiId?.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{item.kpiId?.description}</p>
              </div>
              <div className="text-right">
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-sm font-medium">
                  น้ำหนัก: {item.kpiId?.weight}%
                </span>
                <p className="text-xs text-slate-400 mt-2 font-medium">เป้าหมาย: {item.kpiId?.targetScore}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
              {/* Self Assessment */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-700 flex items-center gap-2 bg-blue-100/50 p-2 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div> ประเมินตนเอง
                </h4>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">คะแนนที่ได้</label>
                  <input 
                    type="number" 
                    value={item.selfScore || ''} 
                    onChange={e => handleScoreChange(index, "selfScore", e.target.value)}
                    disabled={isSelfAssessed}
                    className="w-full border-slate-200 shadow-sm rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">คำอธิบาย/ผลงานที่ทำได้</label>
                  <textarea 
                    value={item.selfComment || ''}
                    onChange={e => handleCommentChange(index, "selfComment", e.target.value)}
                    disabled={isSelfAssessed}
                    rows={4}
                    className="w-full border-slate-200 shadow-sm rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed resize-none text-sm transition-all"
                  ></textarea>
                </div>
              </div>

              {/* Supervisor Assessment */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-700 flex items-center gap-2 bg-indigo-100/50 p-2 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div> การประเมินจากผู้บังคับบัญชา
                </h4>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">คะแนนอนุมัติ</label>
                  <input 
                    type="number" 
                    value={item.supervisorScore || ''} 
                    onChange={e => handleScoreChange(index, "supervisorScore", e.target.value)}
                    disabled={isCompleted || evaluation.status === "PENDING"}
                    className="w-full border-slate-200 shadow-sm rounded-xl p-3 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">ความเห็นพิจารณา</label>
                  <textarea 
                    value={item.supervisorComment || ''}
                    onChange={e => handleCommentChange(index, "supervisorComment", e.target.value)}
                    disabled={isCompleted || evaluation.status === "PENDING"}
                    rows={4}
                    className="w-full border-slate-200 shadow-sm rounded-xl p-3 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed resize-none text-sm transition-all"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="p-8 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">
            ไม่มีรายการตัวชี้วัด (โปรดเพิ่มตัวชี้วัดผ่านระบบหลักก่อนสร้างการประเมิน)
          </div>
        )}
      </div>

      {/* AI Analysis Section */}
      {evaluation.status !== "PENDING" && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              AI Feedback & Bias Analysis
            </h3>
            {!isCompleted && (
              <button 
                onClick={handleGenerateAI}
                disabled={generatingAI}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {generatingAI ? "กำลังประมวลผล..." : "ให้ AI วิเคราะห์ผลความโปร่งใส"}
              </button>
            )}
          </div>
          
          {evaluation.aiFeedback ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-200/60 p-6 rounded-2xl space-y-4">
              {(() => {
                try {
                  const feedback = JSON.parse(evaluation.aiFeedback);
                  return (
                    <>
                      <div>
                        <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> ข้อเสนอแนะเพื่อการพัฒนา (Feedback)
                        </h4>
                        <p className="text-amber-800/90 leading-relaxed text-sm bg-white/50 p-4 rounded-xl">{feedback.feedback}</p>
                      </div>
                      <div className="pt-4 border-t border-amber-200">
                        <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2 text-sm">
                          <AlertCircle className="w-4 h-4 text-rose-500" /> Bias Detection (ตรวจจับความลำเอียง)
                        </h4>
                        <p className="text-amber-800/90 leading-relaxed text-sm bg-white/50 p-4 rounded-xl">{feedback.biasDetection}</p>
                      </div>
                    </>
                  );
                } catch {
                   return <p className="text-amber-800">{evaluation.aiFeedback}</p>
                }
              })()}
            </div>
          ) : (
            <p className="text-slate-400 italic text-center py-6 bg-slate-50/50 rounded-xl">ยังไม่ได้ทำการวิเคราะห์ด้วย AI กรุณาให้คะแนนครบถ้วนแล้วคลิกวิเคราะห์</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4 pb-12">
        {evaluation.status === "PENDING" && (
          <button 
            onClick={() => handleSave("SELF_ASSESSED")}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-600/20 font-medium transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? "กำลังบันทึก..." : "ส่งแบบประเมินตนเอง"}
          </button>
        )}
        
        {evaluation.status === "SELF_ASSESSED" && (
          <button 
            onClick={() => handleSave("SUPERVISOR_EVALUATED")}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/20 font-medium transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            {saving ? "กำลังบันทึก..." : "ยืนยันผลการประเมินจากหัวหน้า"}
          </button>
        )}
        
        {evaluation.status === "SUPERVISOR_EVALUATED" && (
          <button 
            onClick={() => handleSave("COMPLETED")}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 font-medium transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            {saving ? "กำลังบันทึก..." : "อนุมัติและจบการประเมิน"}
          </button>
        )}
      </div>
    </div>
  )
}

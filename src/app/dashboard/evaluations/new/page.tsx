"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Save } from "lucide-react"
import Link from "next/link"

export default function CreateEvaluationPage() {
  const router = useRouter()
  const [periods, setPeriods] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    periodId: "",
    employeeId: "",
    evaluatorId: "" // optional, left empty means current user
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [periodRes, empRes] = await Promise.all([
          fetch("/api/evaluations/periods"),
          fetch("/api/hrms/employees")
        ])
        if (periodRes.ok) setPeriods(await periodRes.json())
        if (empRes.ok) setEmployees(await empRes.json())
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to create evaluation")
      }
      const newEval = await res.json()
      router.push(`/dashboard/evaluations/${newEval._id}`)
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) return <div className="p-12 text-center text-slate-500">กำลังโหลดข้อมูลแพลตฟอร์ม...</div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link href="/dashboard/evaluations" className="text-slate-500 hover:text-blue-600 flex items-center gap-1 w-fit mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> ย้อนกลับ
      </Link>
      
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">สร้างแบบประเมินผลงานสำหรับพนักงาน</h1>
        
        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">เลือกรอบการประเมิน *</label>
            <select 
              required
              value={formData.periodId}
              onChange={e => setFormData({...formData, periodId: e.target.value})}
              className="w-full border-slate-200 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">-- เลือกรอบการประเมิน --</option>
              {periods.map((p: any) => (
                <option key={p._id} value={p._id}>{p.name} ({p.status})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">เลือกพนักงานที่ถูกประเมิน *</label>
            <select 
              required
              value={formData.employeeId}
              onChange={e => setFormData({...formData, employeeId: e.target.value})}
              className="w-full border-slate-200 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">-- เลือกพนักงาน --</option>
              {employees.map((e: any) => (
                <option key={e._id} value={e._id}>{e.firstName} {e.lastName} ({e.position})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ผู้ประเมิน <span className="text-slate-400 font-normal">(เว้นว่างหากคุณเป็นผู้ประเมินเอง)</span>
            </label>
            <select 
              value={formData.evaluatorId}
              onChange={e => setFormData({...formData, evaluatorId: e.target.value})}
              className="w-full border border-slate-200 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500 bg-white outline-none transition-all"
            >
              <option value="">-- กำหนดตัวเองเป็นผู้ประเมิน --</option>
              {employees.filter((e: any) => e.userId).map((e: any) => (
                <option key={e._id} value={e.userId?._id || e.userId}>{e.firstName} {e.lastName} ({e.position})</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-600/20 font-medium transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? "กำลังบันทึก..." : "สร้างแบบประเมิน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

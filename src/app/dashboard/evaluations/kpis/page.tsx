"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Target, ShieldAlert, X, Save, Building2 } from "lucide-react"

export default function KPIManagementPage() {
  const [kpis, setKpis] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    _id: "",
    name: "",
    description: "",
    weight: 10,
    targetScore: 100,
    departmentId: ""
  })

  const fetchData = async () => {
    try {
      const [kpiRes, deptRes] = await Promise.all([
        fetch("/api/evaluations/kpis"),
        fetch("/api/hrms/departments")
      ])
      if (kpiRes.ok) setKpis(await kpiRes.json())
      if (deptRes.ok) setDepartments(await deptRes.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenNew = () => {
    setFormData({ _id: "", name: "", description: "", weight: 10, targetScore: 100, departmentId: "" })
    setIsEditing(false)
    setError("")
    setIsModalOpen(true)
  }

  const handleOpenEdit = (kpi: any) => {
    setFormData({
      _id: kpi._id,
      name: kpi.name,
      description: kpi.description || "",
      weight: kpi.weight || 10,
      targetScore: kpi.targetScore || 100,
      departmentId: kpi.departmentId?._id || kpi.departmentId || ""
    })
    setIsEditing(true)
    setError("")
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบตัวชี้วัดนี้?")) return;
    try {
      const res = await fetch(`/api/evaluations/kpis/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const dt = await res.json()
        alert(dt.message || "เกิดข้อผิดพลาดในการลบ")
        return;
      }
      fetchData()
    } catch (err: any) {
      alert("Error: " + err.message)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const url = isEditing ? `/api/evaluations/kpis/${formData._id}` : "/api/evaluations/kpis"
      const method = isEditing ? "PUT" : "POST"

      const payload = {
        name: formData.name,
        description: formData.description,
        weight: Number(formData.weight),
        targetScore: Number(formData.targetScore),
        departmentId: formData.departmentId || null
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || "บันทึกข้อมูลไม่สำเร็จ")
      }

      setIsModalOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">จัดการตัวชี้วัด (KPIs)</h1>
          <p className="text-slate-500 mt-1">กำหนดเกณฑ์การประเมินและน้ำหนักคะแนนสำหรับพนักงานในแต่ละส่วนงาน</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 font-medium"
        >
          <Plus className="w-5 h-5" />
          สร้างตัวชี้วัดใหม่
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-12 text-center text-slate-500">กำลังโหลดข้อมูล...</div>
        ) : kpis.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <ShieldAlert className="w-16 h-16 mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-500">ยังไม่มีข้อมูลตัวชี้วัด</p>
            <p className="text-sm mt-1">คลิกปุ่มด้านบนเพื่อเริ่มต้นสร้างคลัง KPI ขององค์กร</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-100">
                <tr>
                  <th className="p-5 font-semibold text-sm w-1/3">ชื่อตัวชี้วัด / เกณฑ์การประเมิน</th>
                  <th className="p-5 font-semibold text-center text-sm w-1/6">น้ำหนักคะแนน (%)</th>
                  <th className="p-5 font-semibold text-center text-sm w-1/6">คะแนนเป้าหมาย</th>
                  <th className="p-5 font-semibold text-sm w-1/5 text-center">แผนกที่รับผิดชอบ</th>
                  <th className="p-5 font-semibold text-right text-sm">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kpis.map((kpi) => (
                  <tr key={kpi._id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-lg group-hover:bg-blue-100 transition-colors mt-0.5">
                          <Target className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{kpi.name}</h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{kpi.description || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-sm font-semibold border border-slate-200/60">
                        {kpi.weight}%
                      </span>
                    </td>
                    <td className="p-5 text-center text-slate-600 font-medium">
                      {kpi.targetScore}
                    </td>
                    <td className="p-5 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs border border-slate-100">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {kpi.departmentId?.name || "ทั้งหมดส่วนกลาง"}
                      </div>
                    </td>
                    <td className="p-5 text-right space-x-2 whitespace-nowrap">
                      <button 
                        onClick={() => handleOpenEdit(kpi)}
                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(kpi._id)}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Create/Edit KPI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 block max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-10">
              <h2 className="text-xl font-bold text-slate-800">
                {isEditing ? "แก้ไขตัวชี้วัด (KPI)" : "สร้างตัวชี้วัดใหม่ (KPI)"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm border border-rose-100">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่อตัวชี้วัด *</label>
                <input 
                  required
                  type="text"
                  placeholder="เช่น ความสำเร็จในการบริการลูกค้า / จำนวน Bug ในระบบ"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">รายละเอียดเกณฑ์การให้คะแนน</label>
                <textarea 
                  placeholder="อธิบายว่าพนักงานต้องทำผลงานแบบไหนเพื่อให้ได้คะแนนเต็ม"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">น้ำหนักคะแนน (%) *</label>
                  <input 
                    required
                    type="number"
                    min="0"
                    max="100"
                    value={formData.weight}
                    onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
                    className="w-full border border-slate-200 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">คะแนนเป้าหมายเต็ม *</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    value={formData.targetScore}
                    onChange={e => setFormData({...formData, targetScore: Number(e.target.value)})}
                    className="w-full border border-slate-200 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 flex gap-3 text-sm text-sky-800">
                 <div className="min-w-5 pt-0.5">💡</div>
                 <p>ตัวอย่าง: หากคะแนนเต็ม 100 และนำหนักคะแนนเป็น 60% พนักงานทำได้ 80 คะแนน คะแนนที่จะนำไปคำนวณจริงคือ 48</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">ใช้ประเมินเฉพาะแผนก</label>
                <select
                  value={formData.departmentId}
                  onChange={e => setFormData({...formData, departmentId: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all text-sm"
                >
                  <option value="">ทั้งหมดส่วนกลาง (ใช้ประเมินทุกคนทุกแผนก)</option>
                  {departments.map((d: any) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white/95 pb-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? "กำลังบันทึก..." : "บันทึกตัวชี้วัด"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

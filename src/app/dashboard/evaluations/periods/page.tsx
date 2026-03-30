"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Calendar, ShieldAlert, X, Save } from "lucide-react"

export default function EvaluationPeriodsPage() {
  const [periods, setPeriods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    _id: "",
    name: "",
    startDate: "",
    endDate: "",
    status: "OPEN"
  })

  const fetchPeriods = async () => {
    try {
      const res = await fetch("/api/evaluations/periods")
      if (res.ok) {
        const data = await res.json()
        setPeriods(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPeriods()
  }, [])

  const handleOpenNew = () => {
    setFormData({ _id: "", name: "", startDate: "", endDate: "", status: "OPEN" })
    setIsEditing(false)
    setError("")
    setIsModalOpen(true)
  }

  const handleOpenEdit = (period: any) => {
    // format date for input type="date"
    const formatDate = (dateStr: string) => {
      if (!dateStr) return ""
      const d = new Date(dateStr)
      return d.toISOString().split('T')[0]
    }
    
    setFormData({
      _id: period._id,
      name: period.name,
      startDate: formatDate(period.startDate),
      endDate: formatDate(period.endDate),
      status: period.status || "OPEN"
    })
    setIsEditing(true)
    setError("")
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรอบการประเมินนี้? (การลบจะไม่สามารถกู้คืนได้)")) return;
    try {
      const res = await fetch(`/api/evaluations/periods/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const dt = await res.json()
        alert(dt.message || "เกิดข้อผิดพลาดในการลบ")
        return;
      }
      fetchPeriods()
    } catch (err: any) {
      alert("Error: " + err.message)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const url = isEditing ? `/api/evaluations/periods/${formData._id}` : "/api/evaluations/periods"
      const method = isEditing ? "PUT" : "POST"

      const payload = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status
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
      fetchPeriods()
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
          <h1 className="text-2xl font-bold text-slate-800">รอบการประเมิน</h1>
          <p className="text-slate-500 mt-1">จัดการกำหนดการและเงื่อนไขเวลาของการประเมินผลงานพนักงาน</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 font-medium"
        >
          <Plus className="w-5 h-5" />
          สร้างรอบการประเมิน
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-12 text-center text-slate-500">กำลังโหลดข้อมูล...</div>
        ) : periods.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <ShieldAlert className="w-16 h-16 mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-500">ยังไม่มีข้อมูลรอบการประเมิน</p>
            <p className="text-sm mt-1">คลิกปุ่มด้านบนเพื่อเริ่มต้นสร้างรอบใหม่</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-100">
                <tr>
                  <th className="p-5 font-semibold text-sm w-1/3">ชื่อรอบการประเมิน</th>
                  <th className="p-5 font-semibold text-center text-sm w-1/5">วันที่เริ่มต้น</th>
                  <th className="p-5 font-semibold text-center text-sm w-1/5">วันที่สิ้นสุด</th>
                  <th className="p-5 font-semibold text-center text-sm w-1/6">สถานะ</th>
                  <th className="p-5 font-semibold text-right text-sm">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periods.map((period) => (
                  <tr key={period._id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="p-5 font-medium text-slate-800 flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg group-hover:bg-indigo-100 transition-colors">
                        <Calendar className="w-4 h-4" />
                      </div>
                      {period.name}
                    </td>
                    <td className="p-5 text-center text-slate-600 text-sm">
                      {new Date(period.startDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-5 text-center text-slate-600 text-sm">
                      {new Date(period.endDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-5 text-center">
                      <span className={`font-semibold px-3 py-1.5 rounded-lg text-xs tracking-wide ${
                        period.status === 'OPEN' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {period.status === 'OPEN' ? 'เปิดประเมิน' : 'ปิดประเมินแล้ว'}
                      </span>
                    </td>
                    <td className="p-5 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenEdit(period)}
                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(period._id)}
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

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {isEditing ? "แก้ไขรอบการประเมิน" : "สร้างรอบการประเมินใหม่"}
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
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่อรอบการประเมิน *</label>
                <input 
                  required
                  type="text"
                  placeholder="เช่น รอบประเมินครึ่งปีแรก 2567"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">วันที่เริ่มต้น *</label>
                  <input 
                    required
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">วันที่สิ้นสุด *</label>
                  <input 
                    required
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">สถานะการประเมิน</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
                >
                  <option value="OPEN">เปิดประเมิน (OPEN)</option>
                  <option value="CLOSED">ปิดประเมินแล้ว (CLOSED)</option>
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
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
                  {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

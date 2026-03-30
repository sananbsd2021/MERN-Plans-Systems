"use client"

import { useState, useEffect } from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Settings, X, Clock, MapPin } from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from "date-fns"
import { th } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    summary: "",
    start: "",
    end: "",
    location: "",
    description: ""
  })

  useEffect(() => {
    fetchEvents()
  }, [currentMonth])

  const fetchEvents = async () => {
    setIsLoading(true)
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    
    try {
      const resp = await fetch(`/api/calendar/events?timeMin=${monthStart.toISOString()}&timeMax=${monthEnd.toISOString()}`)
      const data = await resp.json()
      if (Array.isArray(data)) {
        setEvents(data)
      }
    } catch (err) {
      console.error("Failed to fetch events:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const resp = await fetch("/api/calendar/events", {
        method: "POST",
        body: JSON.stringify({
          ...newEvent,
          start: new Date(`${newEvent.start}`).toISOString(),
          end: new Date(`${newEvent.end}`).toISOString(),
        })
      })
      if (resp.ok) {
        setIsModalOpen(false)
        setNewEvent({ summary: "", start: "", end: "", location: "", description: "" })
        fetchEvents()
      } else {
        const data = await resp.json()
        alert(`Error: ${data.error}`)
      }
    } catch (err) {
      alert("Failed to add event")
    } finally {
      setIsLoading(false)
    }
  }

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            ปฏิทินกิจกรรม
          </h1>
          <p className="text-muted-foreground mt-1">
            จัดการและติดตามกิจกรรมต่างๆ พร้อมระบบแจ้งเตือนอัตโนมัติ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setNewEvent({ ...newEvent, start: format(selectedDate, "yyyy-MM-dd'T'HH:mm"), end: format(selectedDate, "yyyy-MM-dd'T'HH:mm") })
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>เพิ่มกิจกรรม</span>
          </button>
          <button className="p-2 border rounded-lg hover:bg-muted transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    )
  }

  const renderDays = () => {
    const days = []
    const date = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."]

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-sm font-semibold text-muted-foreground py-2">
          {date[i]}
        </div>
      )
    }

    return <div className="grid grid-cols-7 border-b pb-2">{days}</div>
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ""

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d")
        const cloneDay = day
        const dayEvents = events.filter(e => {
          const eventDate = e.start?.dateTime || e.start?.date
          return eventDate && isSameDay(parseISO(eventDate), cloneDay)
        })

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-[120px] p-2 border-r border-b relative hover:bg-muted/30 transition-colors cursor-pointer group",
              !isSameMonth(day, monthStart) ? "bg-muted/10 text-muted-foreground/50" : "",
              isSameDay(day, selectedDate) ? "bg-primary/5 border-primary/20" : "",
              isSameDay(day, new Date()) ? "font-bold" : ""
            )}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <div className="flex justify-between items-start">
              <span className={cn(
                "text-sm",
                isSameDay(day, new Date()) ? "inline-flex items-center justify-center w-7 h-7 bg-primary text-primary-foreground rounded-full" : ""
              )}>
                {formattedDate}
              </span>
            </div>
            <div className="mt-2 space-y-1 overflow-hidden h-[70px]">
              {dayEvents.map((event, idx) => (
                <div 
                  key={idx} 
                  className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 truncate border border-blue-200"
                  title={event.summary}
                >
                  {event.summary}
                </div>
              ))}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      )
      days = []
    }
    return <div className="border-l border-t rounded-tl-xl overflow-hidden shadow-sm">{rows}</div>
  }

  const handleSync = async () => {
    try {
      const resp = await fetch("/api/jobs/calendar-notify", { method: "POST" })
      const data = await resp.json()
      if (data.success) {
        alert(`สำเร็จ! ส่งข้อมูลกิจกรรม ${data.count} รายการไปยัง Line แล้ว`)
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.message || data.error}`)
      }
    } catch (err) {
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้")
    }
  }

  const selectedDayEvents = events.filter(e => {
    const eventDate = e.start?.dateTime || e.start?.date
    return eventDate && isSameDay(parseISO(eventDate), selectedDate)
  })

  return (
    <div className="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
      {renderHeader()}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">
                  {format(currentMonth, "MMMM yyyy", { locale: th })}
                </h2>
                <div className="flex items-center gap-1">
                  <button onClick={prevMonth} className="p-1 hover:bg-muted rounded-full">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={nextMonth} className="p-1 hover:bg-muted rounded-full">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isLoading && <span className="text-xs text-muted-foreground animate-pulse">กำลังโหลด...</span>}
                <button 
                  onClick={() => setCurrentMonth(new Date())}
                  className="text-sm border px-3 py-1 rounded-md hover:bg-muted transition-colors font-medium"
                >
                  วันนี้
                </button>
              </div>
            </div>

            <div className="p-4">
              {renderDays()}
              {renderCells()}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-2xl border p-6 shadow-sm min-h-[300px]">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              {format(selectedDate, "d MMMM yyyy", { locale: th })}
            </h3>
            <div className="space-y-4">
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">ไม่มีกิจกรรมสำหรับวันนี้</p>
              ) : (
                selectedDayEvents.map((event, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-muted/30 hover:border-primary/30 transition-colors">
                    <div className="font-medium text-sm text-primary mb-1">{event.summary}</div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {event.start?.dateTime ? format(parseISO(event.start.dateTime), "HH:mm") : "ทั้งวัน"}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-primary/5 rounded-2xl border border-primary/10 p-6">
            <h3 className="font-semibold mb-2 text-primary flex items-center justify-between">
              ระบบแจ้งเตือน Line
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              กิจกรรมในปฏิทินจะถูกส่งแจ้งเตือนไปยังกลุ่ม Line อัตโนมัติทุกเช้า 
              <span className="block mt-2 font-medium text-xs text-amber-700">
                ⚠️ โปรดระบุค่าใน .env.local ให้ครบถ้วน
              </span>
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border">
                <span className="text-xs font-medium">สถานะ Line OA:</span>
                <span className="text-xs text-green-600 font-semibold">เชื่อมต่อแล้ว</span>
              </div>
              
              <div className="pt-2">
                <button 
                  onClick={handleSync}
                  className="w-full py-2.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-all font-medium shadow-sm flex items-center justify-center gap-2"
                >
                  <CalendarIcon className="h-3 w-3" />
                  ส่งแจ้งเตือนกิจกรรมวันนี้ทันที
                </button>
                <p className="text-[10px] text-center text-muted-foreground mt-3">
                  วิธีหา Group ID: เชิญบอทเข้ากลุ่ม แล้วส่งข้อความ "ขอ ID" <br />
                  จากนั้นดูที่ <a href="/api/line/debug" target="_blank" className="underline text-primary">/api/line/debug</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-card rounded-2xl border shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">เพิ่มกิจกรรมใหม่</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-muted rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddEvent} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">หัวข้อกิจกรรม</label>
                  <input
                    required
                    value={newEvent.summary}
                    onChange={e => setNewEvent({ ...newEvent, summary: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="เช่น ประชุมสภาประจำเดือน"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">เวลาเริ่ม</label>
                    <input
                      required
                      type="datetime-local"
                      value={newEvent.start}
                      onChange={e => setNewEvent({ ...newEvent, start: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">เวลาสิ้นสุด</label>
                    <input
                      required
                      type="datetime-local"
                      value={newEvent.end}
                      onChange={e => setNewEvent({ ...newEvent, end: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">สถานที่ (ไม่บังคับ)</label>
                  <input
                    value={newEvent.location}
                    onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="เช่น ห้องประชุมชั้น 2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">รายละเอียด (ไม่บังคับ)</label>
                  <textarea
                    value={newEvent.description}
                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                  >
                    {isLoading ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

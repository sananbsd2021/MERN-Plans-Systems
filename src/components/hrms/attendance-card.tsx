"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, LogOut, Loader2, Calendar, MapPin } from "lucide-react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import Link from "next/link"

export function AttendanceCard() {
  const [time, setTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [record, setRecord] = useState<{ 
    checkIn?: string; 
    checkOut?: string; 
    status?: string;
    checkInLocation?: { lat: number; lng: number };
    checkOutLocation?: { lat: number; lng: number }
  } | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchStatus()
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/hrms/attendance/my-attendance")
      const data = await res.json()
      if (res.ok) {
        setRecord(data.record)
      }
    } catch (err) {
      console.error("Failed to fetch attendance status", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (type: 'checkIn' | 'checkOut') => {
    setSubmitting(true)
    setError("")
    
    // Helper function to get location — non-blocking: always resolves (with null on failure)
    const getLocation = (): Promise<{ lat: number; lng: number } | null> => {
      setGettingLocation(true)
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          console.warn("Geolocation is not supported by this browser.")
          setGettingLocation(false)
          resolve(null)
          return
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setGettingLocation(false)
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
          },
          (error) => {
            setGettingLocation(false)
            switch (error.code) {
              case error.PERMISSION_DENIED:
                // Blocking: user must grant permission
                setError("โปรดอนุญาตให้เข้าถึงตำแหน่งก่อนลงเวลา")
                break
              case error.POSITION_UNAVAILABLE:
              case error.TIMEOUT:
                // Non-blocking: warn but still allow check-in/out without location
                console.warn(`Geolocation warning [${error.code}]: ${error.message} — proceeding without location.`)
                setError("ไม่สามารถระบุตำแหน่งได้ในขณะนี้ (ลงเวลาโดยไม่มีพิกัด GPS)")
                break
            }
            resolve(null)
          },
          // Use cached position (≤60s old) to speed up; raise timeout to 15s
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        )
      }) as Promise<{ lat: number; lng: number } | null>
    }

    try {
      const location = await getLocation()
      
      const res = await fetch("/api/hrms/attendance/my-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, location }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to record attendance")
      
      setRecord(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="h-24 bg-muted/50" />
        <CardContent className="h-32 bg-muted/20" />
      </Card>
    )
  }

  const isCheckedIn = !!record?.checkIn
  const isCheckedOut = !!record?.checkOut

  return (
    <Card className="overflow-hidden border-2 border-blue-100 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white pb-6 pt-4">
        <div className="flex justify-between items-center mb-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock className="h-5 w-5" /> ลงเวลาปฏิบัติราชการ
          </CardTitle>
          <Badge variant="outline" className="bg-white/20 text-white border-none">
            {format(new Date(), "eeee d MMMM yyyy", { locale: th })}
          </Badge>
        </div>
        <div className="text-3xl font-mono font-bold tracking-widest mt-2">
          {format(time, "HH:mm:ss")}
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {error && (
          <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 mb-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="text-xs text-green-700 font-medium mb-1">เข้างาน (Check-in)</div>
            <div className={`text-lg font-bold ${isCheckedIn ? 'text-green-800' : 'text-slate-400 font-normal italic'}`}>
              {(isCheckedIn && record?.checkIn) ? format(new Date(record.checkIn), "HH:mm") : "ยังไม่ได้ลงเวลา"}
            </div>
            {isCheckedIn && record?.status === 'LATE' && (
              <Badge variant="secondary" className="mt-1 bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">เข้างานสาย</Badge>
            )}
            {isCheckedIn && record?.checkInLocation && (
              <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5" /> 
                {record.checkInLocation.lat.toFixed(4)}, {record.checkInLocation.lng.toFixed(4)}
              </div>
            )}
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="text-xs text-red-700 font-medium mb-1">ออกงาน (Check-out)</div>
            <div className={`text-lg font-bold ${isCheckedOut ? 'text-red-800' : 'text-slate-400 font-normal italic'}`}>
              {(isCheckedOut && record?.checkOut) ? format(new Date(record.checkOut), "HH:mm") : "ยังไม่ได้ลงเวลา"}
            </div>
            {isCheckedOut && record?.checkOutLocation && (
              <div className="text-[10px] text-rose-600 mt-1 flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5" /> 
                {record.checkOutLocation.lat.toFixed(4)}, {record.checkOutLocation.lng.toFixed(4)}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-base font-bold shadow-lg" 
            disabled={isCheckedIn || submitting}
            onClick={() => handleAction('checkIn')}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> 
                {gettingLocation ? "ค้นหา GPS..." : "กำลังบันทึก..."}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                ลงเวลาเข้างาน
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            className="flex-1 h-12 border-2 border-slate-200 hover:border-red-600 hover:text-red-600 text-base font-bold transition-all" 
            disabled={!isCheckedIn || isCheckedOut || submitting}
            onClick={() => handleAction('checkOut')}
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <LogOut className="h-5 w-5 mr-2" />
            )}
            {submitting && gettingLocation ? "ค้นหา GPS..." : "ลงเวลาออกงาน"}
          </Button>
        </div>

        <div className="pt-2 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-600 font-medium bg-emerald-50 py-1 rounded-full border border-emerald-100/50">
               <MapPin className="h-3 w-3" /> ระบบบันทึกพิกัดตำแหน่ง (GPS) อัตโนมัติ
            </div>
            <Link href="/dashboard/hrms/attendance" className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1">
                <Calendar className="h-3 w-3" /> ดูประวัติการลงเวลาย้อนหลัง
            </Link>
            <div className="text-[10px] text-muted-foreground border-t pt-2">
              ต้องการลงเวลาผ่าน LINE? เพิ่มเพื่อน <span className="font-bold text-green-600">@อบต-ระบบแผน</span> แล้วส่งอีเมลของคุณเพื่อเชื่อมต่อ
            </div>
        </div>
      </CardContent>
    </Card>
  )
}


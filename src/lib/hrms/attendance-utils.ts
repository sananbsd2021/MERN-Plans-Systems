import Attendance, { AttendanceStatus } from "@/models/Attendance"
import mongoose from "mongoose"

export async function performCheckIn(
  tenantId: string | mongoose.Types.ObjectId, 
  employeeId: string | mongoose.Types.ObjectId, 
  note?: string,
  location?: { lat: number; lng: number; address?: string }
) {
  const today = new Date()
  const dateOnly = new Date(today)
  dateOnly.setHours(0, 0, 0, 0)
  const tomorrow = new Date(dateOnly)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const existing = await Attendance.findOne({
    tenantId,
    employeeId,
    date: { $gte: dateOnly, $lt: tomorrow }
  })

  if (existing && existing.checkIn) {
    throw new Error("ลงเวลาเข้างานไปแล้ว")
  }

  // Determine status (late if after 08:31)
  let status = AttendanceStatus.PRESENT
  const checkInTime = new Date()
  if (checkInTime.getHours() > 8 || (checkInTime.getHours() === 8 && checkInTime.getMinutes() > 30)) {
    status = AttendanceStatus.LATE
  }

  if (existing) {
    return await Attendance.findByIdAndUpdate(existing._id, {
      checkIn: checkInTime,
      checkInLocation: location,
      status,
      note: note || existing.note
    }, { new: true })
  } else {
    return await Attendance.create({
      tenantId,
      employeeId,
      date: dateOnly,
      checkIn: checkInTime,
      checkInLocation: location,
      status,
      note
    })
  }
}

export async function performCheckOut(
  tenantId: string | mongoose.Types.ObjectId, 
  employeeId: string | mongoose.Types.ObjectId, 
  note?: string,
  location?: { lat: number; lng: number; address?: string }
) {
  const today = new Date()
  const dateOnly = new Date(today)
  dateOnly.setHours(0, 0, 0, 0)
  const tomorrow = new Date(dateOnly)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const existing = await Attendance.findOne({
    tenantId,
    employeeId,
    date: { $gte: dateOnly, $lt: tomorrow }
  })

  if (!existing || !existing.checkIn) {
    throw new Error("ยังไม่ได้ลงเวลาเข้างาน")
  }
  if (existing.checkOut) {
    throw new Error("ลงเวลาออกงานไปแล้ว")
  }

  return await Attendance.findByIdAndUpdate(existing._id, {
    checkOut: new Date(),
    checkOutLocation: location,
    note: note || existing.note
  }, { new: true })
}

export async function getTodayRecord(tenantId: string | mongoose.Types.ObjectId, employeeId: string | mongoose.Types.ObjectId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return await Attendance.findOne({
    tenantId,
    employeeId,
    date: { $gte: today, $lt: tomorrow }
  })
}

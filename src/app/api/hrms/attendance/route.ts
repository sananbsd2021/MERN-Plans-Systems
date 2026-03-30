import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Attendance, { AttendanceStatus } from "@/models/Attendance"
import Employee from "@/models/Employee"
import { z } from "zod"

const attendanceSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().pipe(z.coerce.date()),
  checkIn: z.string().pipe(z.coerce.date()).optional(),
  checkOut: z.string().pipe(z.coerce.date()).optional(),
  status: z.enum(Object.values(AttendanceStatus) as [string, ...string[]]).optional(),
  note: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get("employeeId")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  
  await connectDB()
  const query: any = { tenantId: session.user.tenantId }
  
  if (employeeId) query.employeeId = employeeId
  if (startDate || endDate) {
    query.date = {}
    if (startDate) query.date.$gte = new Date(startDate)
    if (endDate) query.date.$lte = new Date(endDate)
  }
  
  const records = await Attendance.find(query)
    .populate("employeeId", "firstName lastName position")
    .sort({ date: -1 })
  
  const summary = searchParams.get("summary") === "true";
  if (summary) {
    const totalDays = records.length;
    const onTimeDays = records.filter(r => r.status === 'PRESENT').length;
    const lateDays = records.filter(r => r.status === 'LATE').length;
    const leaveDays = records.filter(r => r.status === 'LEAVE').length;
    
    return NextResponse.json({
      records,
      stats: {
        totalDays,
        onTimeDays,
        lateDays,
        leaveDays,
        consistencyRate: totalDays > 0 ? (onTimeDays / totalDays) * 100 : 0
      }
    });
  }
  
  return NextResponse.json(records)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = attendanceSchema.parse(body)
    
    await connectDB()
    
    // Check if record already exists for this date and employee
    const existing = await Attendance.findOne({
      tenantId: session.user.tenantId,
      employeeId: validatedData.employeeId,
      date: {
        $gte: new Date(validatedData.date.setHours(0,0,0,0)),
        $lte: new Date(validatedData.date.setHours(23,59,59,999))
      }
    })
    
    let record;
    if (existing) {
      record = await Attendance.findByIdAndUpdate(existing._id, validatedData, { new: true })
    } else {
      record = await Attendance.create({
        ...validatedData,
        tenantId: session.user.tenantId,
      })
    }
    
    return NextResponse.json(record)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Employee from "@/models/Employee"
import { performCheckIn, performCheckOut, getTodayRecord } from "@/lib/hrms/attendance-utils"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  
  console.log(`[Attendance API] GET Self - User: ${session.user.email}, Tenant: ${session.user.tenantId}`)
  
  let employee = await Employee.findOne({ 
    tenantId: session.user.tenantId, 
    userId: session.user.id 
  })
  
  if (!employee && session.user.email) {
    console.log(`[Attendance API] Linking employee for email: ${session.user.email}`)
    employee = await Employee.findOneAndUpdate(
      { tenantId: session.user.tenantId, email: session.user.email },
      { $set: { userId: session.user.id } },
      { returnDocument: 'after' }
    )
  }

  // Fallback: Auto-create employee record if not found (to facilitate development/testing)
  if (!employee && session.user.email) {
    console.log(`[Attendance API] Auto-creating employee record for ${session.user.email}`)
    employee = await Employee.create({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      employeeId: `EMP-${session.user.email?.split('@')[0].toUpperCase()}`,
      firstName: session.user.name?.split(' ')[0] || "Test",
      lastName: session.user.name?.split(' ')[1] || "User",
      email: session.user.email,
      position: "Demo User",
      status: "ACTIVE",
      joinDate: new Date()
    })
  }
  
  if (!employee) {
    console.log(`[Attendance API] Employee NOT FOUND for email: ${session.user.email}`)
    return NextResponse.json({ 
      message: `ไม่พบข้อมูลพนักงานสำหรับอีเมล: ${session.user.email || 'N/A'} กรุณาติดต่อฝ่ายบุคคลเพื่อลงทะเบียนพนักงานก่อนใช้งาน`,
      debug: { email: session.user.email, tenantId: session.user.tenantId }
    }, { status: 400 })
  }

  const record = await getTodayRecord(session.user.tenantId, employee._id)
  
  return NextResponse.json({ employee, record })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  let body;
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 })
  }
  const { type, note, location } = body
  
  await connectDB()
  
  console.log(`[Attendance API] POST Self - Type: ${type}, User: ${session.user.email}`)
  
  let employee = await Employee.findOne({ 
    tenantId: session.user.tenantId, 
    userId: session.user.id 
  })
  
  if (!employee && session.user.email) {
    console.log(`[Attendance API] Linking employee for email: ${session.user.email}`)
    employee = await Employee.findOneAndUpdate(
      { tenantId: session.user.tenantId, email: session.user.email },
      { $set: { userId: session.user.id } },
      { returnDocument: 'after' }
    )
  }

  // Fallback: Auto-create employee record if not found
  if (!employee && session.user.email) {
    console.log(`[Attendance API] Auto-creating employee record for ${session.user.email}`)
    employee = await Employee.create({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      employeeId: `EMP-${session.user.email?.split('@')[0].toUpperCase()}`,
      firstName: session.user.name?.split(' ')[0] || "Test",
      lastName: session.user.name?.split(' ')[1] || "User",
      email: session.user.email,
      position: "Demo User",
      status: "ACTIVE",
      joinDate: new Date()
    })
  }
  
  if (!employee) {
    console.log(`[Attendance API] Employee NOT FOUND (POST) for email: ${session.user.email}`)
    return NextResponse.json({ 
      message: `ไม่พบข้อมูลพนักงานสำหรับอีเมล: ${session.user.email || 'N/A'} กรุณาติดต่อฝ่ายบุคคลเพื่อลงทะเบียนพนักงานก่อนใช้งาน`,
      debug: { email: session.user.email, tenantId: session.user.tenantId }
    }, { status: 400 })
  }

  try {
    let record
    if (type === 'checkIn') {
      record = await performCheckIn(session.user.tenantId, employee._id, note, location)
    } else if (type === 'checkOut') {
      record = await performCheckOut(session.user.tenantId, employee._id, note, location)
    }
    console.log(`[Attendance API] Action successful: ${type}`)
    return NextResponse.json(record)
  } catch (err: unknown) {
    console.error(`[Attendance API] Action failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    return NextResponse.json({ message: err instanceof Error ? err.message : "An unexpected error occurred" }, { status: 400 })
  }
}

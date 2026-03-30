import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Employee, { EmployeeStatus } from "@/models/Employee"
import Department from "@/models/Department"
import LeaveRequest, { LeaveStatus } from "@/models/LeaveRequest"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const tenantId = session.user.tenantId
  
  const [
    totalEmployees,
    activeEmployees,
    totalDepartments,
    pendingLeaves,
    latestEmployees
  ] = await Promise.all([
    Employee.countDocuments({ tenantId }),
    Employee.countDocuments({ tenantId, status: EmployeeStatus.ACTIVE }),
    Department.countDocuments({ tenantId }),
    LeaveRequest.countDocuments({ tenantId, status: LeaveStatus.PENDING }),
    Employee.find({ tenantId }).sort({ createdAt: -1 }).limit(5).populate("departmentId", "name")
  ])
  
  return NextResponse.json({
    totalEmployees,
    activeEmployees,
    totalDepartments,
    pendingLeaves,
    latestEmployees
  })
}

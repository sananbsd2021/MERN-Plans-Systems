import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import AuditLog from "@/models/AuditLog"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    // Only allow Admins to view audit logs
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role as string)) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const logs = await AuditLog.find({ tenantId: session.user.tenantId })
        .populate("userId", "name role")
        .sort({ createdAt: -1 })
        .limit(100)

    return NextResponse.json(logs)
  } catch (error) {
    console.error("GET AuditLogs Error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}

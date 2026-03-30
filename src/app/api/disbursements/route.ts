import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Disbursement from "@/models/Disbursement"
import Project from "@/models/Project"
import { z } from "zod"

const disbursementSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  budgetId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  disbursementDate: z.string(),
  remarks: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    await connectDB()
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")

    const query: any = { tenantId: session.user.tenantId }
    if (projectId) query.projectId = projectId

    const disbursements = await Disbursement.find(query)
      .populate({ path: "projectId", select: "name" })
      .sort({ disbursementDate: -1, createdAt: -1 })
      .lean()

    return NextResponse.json(disbursements)
  } catch (error) {
    console.error("GET Disbursements Error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    
    // Allow OFFICER and above to request disbursement
    const role = session.user.role as string
    if (!["SUPER_ADMIN", "ADMIN", "POLICY_ANALYST", "OFFICER"].includes(role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = disbursementSchema.parse(body)

    await connectDB()

    const project = await Project.findOne({ _id: validatedData.projectId, tenantId: session.user.tenantId })
    if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 })

    const newDisbursement = await Disbursement.create({
      tenantId: session.user.tenantId,
      ...validatedData,
      status: "PENDING"
    })

    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "CREATE",
      resourceType: "Disbursement",
      resourceId: newDisbursement._id,
      details: JSON.stringify({
        title: newDisbursement.title,
        amount: newDisbursement.amount,
        projectId: newDisbursement.projectId
      })
    })

    return NextResponse.json(newDisbursement, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ message: "Invalid data", errors: error.issues }, { status: 400 })
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}

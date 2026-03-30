import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Budget from "@/models/Budget"
import Project from "@/models/Project"
import { z } from "zod"

const budgetSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  year: z.number().min(2000, "Invalid year"),
  allocatedAmount: z.number().min(0, "Amount must be positive"),
  department: z.string().min(1, "Department is required"),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = new URL(req.url)
    const year = searchParams.get("year")
    
    // Build query scoped to tenant
    const query: any = { tenantId: session.user.tenantId }
    if (year) query.year = parseInt(year)

    // Populate project name
    const budgets = await Budget.find(query)
      .populate({ path: "projectId", select: "name" })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(budgets)
  } catch (error) {
    console.error("GET Budget Error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only Admins or Policy Analysts should add budgets
    if (!["SUPER_ADMIN", "ADMIN", "POLICY_ANALYST"].includes(session.user.role as string)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = budgetSchema.parse(body)

    await connectDB()

    // Verify project exists and belongs to tenant
    const project = await Project.findOne({
      _id: validatedData.projectId,
      tenantId: session.user.tenantId,
    })

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    // Check if budget for this project and year already exists
    const existingBudget = await Budget.findOne({
      tenantId: session.user.tenantId,
      projectId: validatedData.projectId,
      year: validatedData.year,
    })

    if (existingBudget) {
      return NextResponse.json({ message: "Budget for this project and year already exists" }, { status: 400 })
    }

    const budget = await Budget.create({
      tenantId: session.user.tenantId,
      ...validatedData,
      spentAmount: 0,
      riskLevel: "LOW",
    })

    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "CREATE",
      resourceType: "Budget",
      resourceId: budget._id,
      details: JSON.stringify(validatedData)
    })

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    console.error("POST Budget Error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.issues }, { status: 400 })
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}

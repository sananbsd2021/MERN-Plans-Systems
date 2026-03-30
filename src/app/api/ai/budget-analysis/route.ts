import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Budget from "@/models/Budget"
import { predictBudgetRisk } from "@/lib/ai/gemini"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { budgetId } = await req.json()
    if (!budgetId) {
      return NextResponse.json({ message: "budgetId is required" }, { status: 400 })
    }

    await connectDB()

    const budget = await Budget.findOne({
      _id: budgetId,
      tenantId: session.user.tenantId,
    })

    if (!budget) {
      return NextResponse.json({ message: "Budget not found" }, { status: 404 })
    }

    const result = await predictBudgetRisk({
      department: budget.department,
      allocatedAmount: budget.allocatedAmount,
      spentAmount: budget.spentAmount,
      remainingAmount: budget.remainingAmount,
      year: budget.year,
    })

    if (!result) {
      return NextResponse.json({ message: "AI analysis failed" }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Budget AI Analysis Error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}

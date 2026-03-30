import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Budget from "@/models/Budget"
import KPI from "@/models/KPI"
import Project from "@/models/Project"
import { analyzeTrend } from "@/lib/ai/gemini"

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const { type } = await req.json()
    const tenantId = req.auth.user.tenantId
    await connectDB()

    let contextData = ""
    let targetName = ""

    if (type === "budget") {
      const budgets = await Budget.find({ tenantId }).sort({ year: 1 }).lean()
      targetName = "ภาพรวมงบประมาณ"
      contextData = JSON.stringify(budgets.map(b => ({
        year: b.year,
        allocated: b.allocatedAmount,
        spent: b.spentAmount,
        department: b.department
      })))
    } else if (type === "kpi") {
      const kpis = await KPI.find({ tenantId }).populate('projectId', 'name').lean()
      targetName = "ภาพรวมตัวชี้วัด (KPI)"
      contextData = JSON.stringify(kpis.map(k => ({
        name: k.name,
        target: k.targetValue,
        current: k.currentValue,
        unit: k.unit,
        project: (k.projectId as any)?.name
      })))
    }

    const result = await analyzeTrend(targetName, contextData)

    if (!result) {
      return NextResponse.json({ message: "AI analysis failed" }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("AI Trend Forecasting Error:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
})

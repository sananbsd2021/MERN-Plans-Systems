import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Budget from "@/models/Budget"
import KPI from "@/models/KPI"
import Project from "@/models/Project"
import { analyzeExecutiveInsights } from "@/lib/ai/gemini"

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const tenantId = req.auth.user.tenantId
    await connectDB()

    const [budgets, kpis, projects] = await Promise.all([
      Budget.find({ tenantId }).sort({ year: 1 }).lean(),
      KPI.find({ tenantId }).lean(),
      Project.find({ tenantId }).lean()
    ])

    const contextData = {
      budgetsCount: budgets.length,
      totalBudgetAllocated: budgets.reduce((acc, b) => acc + (b.allocatedAmount || 0), 0),
      totalBudgetSpent: budgets.reduce((acc, b) => acc + (b.spentAmount || 0), 0),
      kpisCount: kpis.length,
      averageKpiSuccess: kpis.length > 0 ? kpis.reduce((acc, k) => acc + (k.currentValue / k.targetValue), 0) / kpis.length * 100 : 0,
      projectsCount: projects.length,
      projectsStatus: projects.reduce((acc: any, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {})
    }

    const result = await analyzeExecutiveInsights(contextData)

    if (!result) {
      return NextResponse.json({ message: "AI analysis failed" }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("AI Executive Insights Error:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
})

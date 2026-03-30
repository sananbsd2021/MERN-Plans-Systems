import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import KPI from "@/models/KPI"
import { analyzeKPI } from "@/lib/ai/gemini"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { kpiId } = await req.json()
    if (!kpiId) {
      return NextResponse.json({ message: "kpiId is required" }, { status: 400 })
    }

    await connectDB()

    const kpi = await KPI.findOne({
      _id: kpiId,
      tenantId: session.user.tenantId,
    })

    if (!kpi) {
      return NextResponse.json({ message: "KPI not found" }, { status: 404 })
    }

    const result = await analyzeKPI({
      name: kpi.name,
      targetValue: kpi.targetValue,
      currentValue: kpi.currentValue,
      unit: kpi.unit,
    })

    if (!result) {
      return NextResponse.json({ message: "AI analysis failed" }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("KPI AI Analysis Error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}

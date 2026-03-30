import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Evaluation from "@/models/Evaluation"
import EvaluationItem from "@/models/EvaluationItem"
import { analyzeEvaluationResults } from "@/lib/ai/gemini"

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const { evaluationId } = await req.json()
    if (!evaluationId) return NextResponse.json({ message: "Evaluation ID is required" }, { status: 400 })
    
    await connectDB()
    
    const evaluation = await Evaluation.findOne({ 
      _id: evaluationId, 
      tenantId: req.auth.user.tenantId 
    }).populate("employeeId", "firstName lastName position")
    
    if (!evaluation) return NextResponse.json({ message: "Evaluation not found" }, { status: 404 })
    
    const items = await EvaluationItem.find({ evaluationId }).populate("kpiId", "name weight targetScore")
    
    const evaluationData = {
      employeeName: `${(evaluation.employeeId as any).firstName} ${(evaluation.employeeId as any).lastName}`,
      position: (evaluation.employeeId as any).position,
      totalScore: evaluation.totalScore,
      kpis: items.map(item => ({
        kpiName: (item.kpiId as any).name,
        target: (item.kpiId as any).targetScore,
        selfScore: item.selfScore,
        supervisorScore: item.supervisorScore,
        supervisorComment: item.supervisorComment
      }))
    }
    
    const aiResult = await analyzeEvaluationResults(evaluationData)
    
    if (!aiResult) {
      return NextResponse.json({ message: "AI analysis failed" }, { status: 500 })
    }
    
    // Auto-save the generated feedback to the evaluation record
    evaluation.aiFeedback = JSON.stringify(aiResult);
    await evaluation.save()
    
    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: req.auth.user.tenantId,
      userId: req.auth.user.id,
      action: "UPDATE",
      resourceType: "Evaluation",
      resourceId: evaluation._id as string,
      details: "Generated AI Feedback",
    })

    return NextResponse.json(aiResult)
  } catch (error: any) {
    console.error("Evaluation AI Error:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
})

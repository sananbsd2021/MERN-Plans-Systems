import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Evaluation, { EvaluationStatus } from "@/models/Evaluation"
import EvaluationItem from "@/models/EvaluationItem"
import "@/models/Employee" 
import "@/models/User" 
import "@/models/EvaluationPeriod" 
import "@/models/PerformanceKPI" 
import { z } from "zod"

const itemSchema = z.object({
  kpiId: z.string().min(1),
  selfScore: z.number().optional(),
  supervisorScore: z.number().optional(),
  selfComment: z.string().optional(),
  supervisorComment: z.string().optional(),
})

const updateEvaluationSchema = z.object({
  status: z.enum(Object.values(EvaluationStatus) as [string, ...string[]]).optional(),
  aiFeedback: z.string().optional(),
  items: z.array(itemSchema).optional(),
})

export const GET = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  await connectDB()
  const { id } = await params
  
  const evaluation = await Evaluation.findOne({ _id: id, tenantId: req.auth.user.tenantId })
    .populate("periodId", "name startDate endDate status")
    .populate("employeeId", "firstName lastName position")
    .populate("evaluatorId", "name")
    
  if (!evaluation) return NextResponse.json({ message: "Evaluation not found" }, { status: 404 })
  
  // Get items
  const items = await EvaluationItem.find({ evaluationId: id }).populate("kpiId", "name description weight targetScore")
  
  return NextResponse.json({ ...evaluation.toObject(), items })
})

export const PUT = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await params
    const body = await req.json()
    const validatedData = updateEvaluationSchema.parse(body)
    await connectDB()
    
    const evaluation = await Evaluation.findOne({ _id: id, tenantId: req.auth.user.tenantId })
    if (!evaluation) return NextResponse.json({ message: "Evaluation not found" }, { status: 404 })
    
    if (validatedData.status) {
      evaluation.status = validatedData.status
    }

    if (validatedData.aiFeedback) {
      evaluation.aiFeedback = validatedData.aiFeedback
    }
    
    // Update items if provided
    let totalScore = 0;
    if (validatedData.items && validatedData.items.length > 0) {
      for (const item of validatedData.items) {
        let evalItem = await EvaluationItem.findOne({ evaluationId: id, kpiId: item.kpiId })
        if (evalItem) {
          if (item.selfScore !== undefined) evalItem.selfScore = item.selfScore
          if (item.supervisorScore !== undefined) evalItem.supervisorScore = item.supervisorScore
          if (item.selfComment !== undefined) evalItem.selfComment = item.selfComment
          if (item.supervisorComment !== undefined) evalItem.supervisorComment = item.supervisorComment
          await evalItem.save()
        } else {
          evalItem = await EvaluationItem.create({
            evaluationId: id,
            kpiId: item.kpiId,
            selfScore: item.selfScore,
            supervisorScore: item.supervisorScore,
            selfComment: item.selfComment,
            supervisorComment: item.supervisorComment,
          })
        }
        
        // Calculate total score using supervisorScore if available, else selfScore
        const scoreToUse = evalItem.supervisorScore ?? evalItem.selfScore ?? 0;
        totalScore += scoreToUse; 
      }
      
      // Update totalScore in evaluation (in a real app, this should be weighted)
      evaluation.totalScore = totalScore;
    }
    
    await evaluation.save()
    
    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: req.auth.user.tenantId,
      userId: req.auth.user.id,
      action: "UPDATE",
      resourceType: "Evaluation",
      resourceId: evaluation._id as string,
      details: JSON.stringify({ status: evaluation.status })
    })
    
    return NextResponse.json(evaluation)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
})

export const DELETE = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  const userRole = req.auth.user.role;
  if (!["EXECUTIVE", "ADMIN", "SUPER_ADMIN"].includes(userRole as string)) {
    return NextResponse.json({ message: "Forbidden: Not enough privileges" }, { status: 403 })
  }

  await connectDB()
  const { id } = await params
  
  const evaluation = await Evaluation.findOneAndDelete({ _id: id, tenantId: req.auth.user.tenantId })
  if (!evaluation) return NextResponse.json({ message: "Evaluation not found" }, { status: 404 })
  
  await EvaluationItem.deleteMany({ evaluationId: id })
  
  const { logAction } = await import("@/lib/utils/audit")
  await logAction({
      tenantId: req.auth.user.tenantId,
      userId: req.auth.user.id,
      action: "DELETE",
      resourceType: "Evaluation",
      resourceId: evaluation._id as string,
      details: "Deleted Evaluation and its items",
  })

  return NextResponse.json({ message: "Evaluation deleted" })
})

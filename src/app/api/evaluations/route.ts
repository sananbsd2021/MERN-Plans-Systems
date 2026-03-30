import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Evaluation, { EvaluationStatus } from "@/models/Evaluation"
import EvaluationPeriod from "@/models/EvaluationPeriod"
import Employee from "@/models/Employee"
import PerformanceKPI from "@/models/PerformanceKPI"
import EvaluationItem from "@/models/EvaluationItem"
import "@/models/User"
import { z } from "zod"

const createEvaluationSchema = z.object({
  periodId: z.string().min(1),
  employeeId: z.string().min(1),
  evaluatorId: z.string().optional(),
})

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  await connectDB()
  
  const { searchParams } = new URL(req.url)
  const role = searchParams.get("role") || "SELF" // "SELF" or "MANAGER"
  
  const tenantId = req.auth.user.tenantId
  const userId = req.auth.user.id
  
  // Find the employee record linked to this user
  const currentEmployee = await Employee.findOne({ userId, tenantId })
  
  let query: any = { tenantId }
  
  if (role === "SELF") {
    if (!currentEmployee) return NextResponse.json({ message: "Employee profile not found for current user" }, { status: 400 })
    query.employeeId = currentEmployee._id
  } else if (role === "MANAGER") {
    // If the user is an EXECUTIVE, ADMIN, or SUPER_ADMIN, they can see ALL team evaluations
    const userRole = req.auth.user.role;
    if (userRole !== "EXECUTIVE" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      query.evaluatorId = userId;
    }
  }
  
  const evaluations = await Evaluation.find(query)
    .populate("periodId", "name startDate endDate status")
    .populate("employeeId", "firstName lastName position")
    .populate("evaluatorId", "name")
    .sort({ createdAt: -1 })
    
  return NextResponse.json(evaluations)
})

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    
    const parsed = createEvaluationSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(e => e.message).join(", ");
      return NextResponse.json({ message: `Validation error: ${errorMsg}` }, { status: 400 })
    }
    
    const validatedData = parsed.data;
    await connectDB()
    
    // Check if period is valid
    const period = await EvaluationPeriod.findOne({ _id: validatedData.periodId, tenantId: req.auth.user.tenantId })
    if (!period) return NextResponse.json({ message: "Invalid Evaluation Period" }, { status: 400 })
    
    // Check if employee is valid
    const employee = await Employee.findOne({ _id: validatedData.employeeId, tenantId: req.auth.user.tenantId })
    if (!employee) return NextResponse.json({ message: "Employee not found" }, { status: 400 })

    // Check if evaluation already exists
    const existing = await Evaluation.findOne({ 
      periodId: validatedData.periodId, 
      employeeId: validatedData.employeeId,
      tenantId: req.auth.user.tenantId
    })
    if (existing) return NextResponse.json({ message: "Evaluation already exists for this employee in this period" }, { status: 400 })
    
    // Evaluate explicit evaluatorId if provided
    let targetEvaluatorId = req.auth.user.id;
    if (validatedData.evaluatorId && validatedData.evaluatorId.trim() !== "") {
      targetEvaluatorId = validatedData.evaluatorId.trim();
      if (!mongoose.Types.ObjectId.isValid(targetEvaluatorId)) {
        return NextResponse.json({ message: "รูปแบบของรหัสผู้ประเมินไม่ถูกต้อง (Invalid ObjectId)" }, { status: 400 })
      }
    }

    const evaluation = await Evaluation.create({
      tenantId: req.auth.user.tenantId,
      periodId: validatedData.periodId,
      employeeId: validatedData.employeeId,
      evaluatorId: targetEvaluatorId,
      status: EvaluationStatus.PENDING
    })

    // Auto-populate EvaluationItems based on the PerformanceKPIs for this employee's department
    const kpis = await PerformanceKPI.find({ 
      tenantId: req.auth.user.tenantId,
      departmentId: employee.departmentId 
    });

    if (kpis.length > 0) {
      const itemsToCreate = kpis.map(kpi => ({
        evaluationId: evaluation._id,
        kpiId: kpi._id,
      }));
      await EvaluationItem.insertMany(itemsToCreate);
    }

    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: req.auth.user.tenantId,
      userId: req.auth.user.id,
      action: "CREATE",
      resourceType: "Evaluation",
      resourceId: evaluation._id as string,
      details: JSON.stringify({ employeeId: evaluation.employeeId, periodId: evaluation.periodId })
    })
    
    return NextResponse.json(evaluation, { status: 201 })
  } catch (error: any) {
    console.error("Evaluation POST Error:", error);
    return NextResponse.json({ message: error.message || "Failed to create evaluation" }, { status: 400 })
  }
})

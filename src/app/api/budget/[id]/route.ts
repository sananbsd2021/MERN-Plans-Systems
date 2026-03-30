import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Budget from "@/models/Budget"
import { z } from "zod"

const budgetUpdateSchema = z.object({
  year: z.number().min(2000, "Invalid year").optional(),
  allocatedAmount: z.number().min(0, "Amount must be positive").optional(),
  spentAmount: z.number().min(0, "Amount must be positive").optional(),
  department: z.string().min(1, "Department is required").optional(),
})

export const PUT = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  if (!["SUPER_ADMIN", "ADMIN", "POLICY_ANALYST"].includes(req.auth.user.role as string)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const validatedData = budgetUpdateSchema.parse(body)
    
    await connectDB()
    const id = (await params).id;
    
    // Find before update to manually calculate risk and remaining
    const existingBudget = await Budget.findOne({ _id: id, tenantId: req.auth.user.tenantId })
    if (!existingBudget) return NextResponse.json({ message: "Budget not found" }, { status: 404 })

    // Merge new data
    const finalAllocated = validatedData.allocatedAmount !== undefined ? validatedData.allocatedAmount : existingBudget.allocatedAmount
    const finalSpent = validatedData.spentAmount !== undefined ? validatedData.spentAmount : existingBudget.spentAmount
    
    const remainingAmount = finalAllocated - finalSpent
    let riskLevel = "LOW"
    if (finalSpent > finalAllocated) {
      riskLevel = "HIGH"
    } else if (finalSpent > finalAllocated * 0.8) {
      riskLevel = "MEDIUM"
    }

    const updatedBudget = await Budget.findOneAndUpdate(
      { _id: id, tenantId: req.auth.user.tenantId },
      { 
        ...validatedData,
        remainingAmount,
        riskLevel
      },
      { new: true, runValidators: true }
    )
    
    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: req.auth.user.tenantId,
      userId: req.auth.user.id,
      action: "UPDATE",
      resourceType: "Budget",
      resourceId: updatedBudget._id,
      details: JSON.stringify(validatedData)
    })
    
    return NextResponse.json(updatedBudget)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.issues }, { status: 400 })
    }
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
})

export const DELETE = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  if (!["SUPER_ADMIN", "ADMIN", "POLICY_ANALYST"].includes(req.auth.user.role as string)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  await connectDB()
  const id = (await params).id;
  
  const budget = await Budget.findOneAndDelete({ _id: id, tenantId: req.auth.user.tenantId })
  
  if (!budget) return NextResponse.json({ message: "Budget not found" }, { status: 404 })
  
  const { logAction } = await import("@/lib/utils/audit")
  await logAction({
    tenantId: req.auth.user.tenantId,
    userId: req.auth.user.id,
    action: "DELETE",
    resourceType: "Budget",
    resourceId: budget._id,
    details: JSON.stringify({ department: budget.department, year: budget.year })
  })

  return NextResponse.json({ message: "Budget deleted successfully" })
})

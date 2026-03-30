import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Disbursement from "@/models/Disbursement"
import Budget from "@/models/Budget"

export const PUT = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  const role = req.auth.user.role as string
  if (!["SUPER_ADMIN", "ADMIN", "POLICY_ANALYST"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { status, remarks } = body

    await connectDB()
    const id = (await params).id;
    
    const disbursement = await Disbursement.findOne({ _id: id, tenantId: req.auth.user.tenantId })
    if (!disbursement) return NextResponse.json({ message: "Disbursement not found" }, { status: 404 })

    // Check if we are transitioning to APPROVED for the first time
    const isApproving = status === "APPROVED" && disbursement.status !== "APPROVED"
    const isRejecting = status === "REJECTED" && disbursement.status === "APPROVED" // from APPROVED to REJECTED (undo)

    disbursement.status = status || disbursement.status
    if (remarks !== undefined) disbursement.remarks = remarks
    await disbursement.save()

    if (isApproving || isRejecting) {
      const { logAction } = await import("@/lib/utils/audit")
      
      // Find the budget (use linked budgetId if available, otherwise search by year)
      let budget;
      if (disbursement.budgetId) {
        budget = await Budget.findOne({ _id: disbursement.budgetId, tenantId: req.auth.user.tenantId })
      } else {
        const year = new Date(disbursement.disbursementDate).getFullYear()
        budget = await Budget.findOne({ 
          tenantId: req.auth.user.tenantId, 
          projectId: disbursement.projectId,
          year: year
        })
      }

      if (budget) {
        if (isApproving) {
          budget.spentAmount = (budget.spentAmount || 0) + disbursement.amount
        } else if (isRejecting) {
          budget.spentAmount = Math.max(0, (budget.spentAmount || 0) - disbursement.amount)
        }
        await budget.save()
        
        await logAction({
          tenantId: req.auth.user.tenantId,
          userId: req.auth.user.id,
          action: "UPDATE",
          resourceType: "Budget",
          resourceId: budget._id,
          details: `Disbursement ${disbursement.title} ${status}. New spentAmount: ${budget.spentAmount}`
        })
      }

      await logAction({
        tenantId: req.auth.user.tenantId,
        userId: req.auth.user.id,
        action: "UPDATE",
        resourceType: "Disbursement",
        resourceId: disbursement._id,
        details: `Status changed to ${status}`
      })
    }

    return NextResponse.json(disbursement)
  } catch (error: any) {
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
  
  const disbursement = await Disbursement.findOne({ _id: id, tenantId: req.auth.user.tenantId })
  if (!disbursement) return NextResponse.json({ message: "Not found" }, { status: 404 })

  if (disbursement.status === "APPROVED") {
    // Revert the spent amount before deleting
    const year = new Date(disbursement.disbursementDate).getFullYear()
    const budget = await Budget.findOne({ 
      tenantId: req.auth.user.tenantId, 
      projectId: disbursement.projectId,
      year: year
    })
    if (budget) {
      budget.spentAmount = Math.max(0, (budget.spentAmount || 0) - disbursement.amount)
      await budget.save()
    }
  }

  await disbursement.deleteOne()
  
  return NextResponse.json({ message: "Deleted" })
})

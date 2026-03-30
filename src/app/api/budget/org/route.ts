import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import OrganizationBudget from "@/models/OrganizationBudget"
import { z } from "zod"

const orgBudgetSchema = z.object({
  year: z.number().min(2000),
  totalAmount: z.number().min(0),
})

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())

  await connectDB()
  const orgBudget = await OrganizationBudget.findOne({ 
    tenantId: req.auth.user.tenantId,
    year 
  })

  return NextResponse.json(orgBudget || { year, totalAmount: 0 })
})

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  if (!["SUPER_ADMIN", "ADMIN"].includes(req.auth.user.role as string)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { year, totalAmount } = orgBudgetSchema.parse(body)
    
    await connectDB()
    
    const updated = await OrganizationBudget.findOneAndUpdate(
      { tenantId: req.auth.user.tenantId, year },
      { totalAmount },
      { upsert: true, new: true }
    )

    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: req.auth.user.tenantId as string,
      userId: req.auth.user.id as string,
      action: "UPDATE",
      resourceType: "OrganizationBudget",
      resourceId: updated._id,
      details: JSON.stringify({ year, totalAmount })
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ message: "Invalid data", errors: error.issues }, { status: 400 })
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
})

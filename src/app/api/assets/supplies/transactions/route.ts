import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Supply from "@/models/Supply"
import SupplyTransaction, { SupplyTransactionType } from "@/models/SupplyTransaction"
import { z } from "zod"

const transactionSchema = z.object({
  supplyId: z.string().min(1),
  type: z.enum(Object.values(SupplyTransactionType) as [string, ...string[]]),
  quantity: z.number().min(1),
  date: z.string().or(z.date()).optional(),
  note: z.string().optional(),
  departmentId: z.string().optional(),
})

export async function GET(req: Request) {
    const session = await auth()
    if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
    const { searchParams } = new URL(req.url)
    const supplyId = searchParams.get("supplyId")
  
    await connectDB()
    const query: Record<string, any> = { tenantId: session.user.tenantId }
    if (supplyId) query.supplyId = supplyId
  
    const transactions = await SupplyTransaction.find(query)
      .populate("supplyId", "name unit")
      .populate("departmentId", "name")
      .populate("performedBy", "name")
      .sort({ date: -1 })
  
    return NextResponse.json(transactions)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const validatedData = transactionSchema.parse(body)

    await connectDB()
    
    // 1. Create the transaction record
    const transaction = await SupplyTransaction.create({
      ...validatedData,
      tenantId: session.user.tenantId,
      performedBy: session.user.id,
    })

    // 2. Update the supply quantity
    const updateQuery = validatedData.type === SupplyTransactionType.IN 
      ? { $inc: { currentQuantity: validatedData.quantity } }
      : { $inc: { currentQuantity: -validatedData.quantity } }

    const supply = await Supply.findOneAndUpdate(
      { _id: validatedData.supplyId, tenantId: session.user.tenantId },
      updateQuery,
      { new: true }
    )

    if (!supply) throw new Error("Supply not found")

    return NextResponse.json({ transaction, supply }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "An unexpected error occurred" }, { status: 400 })
  }
}

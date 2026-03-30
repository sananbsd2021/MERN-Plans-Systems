import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Supply from "@/models/Supply"
import { z } from "zod"

const supplySchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.string().min(1, "Unit is required"),
  categoryId: z.string().min(1, "Category is required"),
  minQuantity: z.number().min(0).optional(),
  costPerUnit: z.number().min(0).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  await connectDB()
  const supplies = await Supply.find({ tenantId: session.user.tenantId })
    .populate("categoryId", "name code")
    .sort({ name: 1 })

  return NextResponse.json(supplies)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const validatedData = supplySchema.parse(body)

    await connectDB()
    const supply = await Supply.create({
      ...validatedData,
      tenantId: session.user.tenantId,
    })

    return NextResponse.json(supply, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "An unexpected error occurred" }, { status: 400 })
  }
}

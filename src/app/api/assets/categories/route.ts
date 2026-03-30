import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import AssetCategory from "@/models/AssetCategory"
import { z } from "zod"
import { logAction } from "@/lib/utils/audit"

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  type: z.enum(["ASSET", "SUPPLY"]).default("ASSET"),
  description: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  await connectDB()
  const query: any = { tenantId: session.user.tenantId }
  if (type) query.type = type

  const categories = await AssetCategory.find(query).sort({ code: 1 })
  return NextResponse.json(categories)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const validatedData = categorySchema.parse(body)

    await connectDB()
    const category = await AssetCategory.create({
      ...validatedData,
      tenantId: session.user.tenantId,
    })

    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "CREATE",
      resourceType: "AssetCategory",
      resourceId: category._id as string,
      details: JSON.stringify({ name: category.name, code: category.code }),
    })

    return NextResponse.json(category, { status: 201 })
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" }, { status: 400 })
    }
    if (err.code === 11000) return NextResponse.json({ message: "Category code already exists" }, { status: 400 })
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

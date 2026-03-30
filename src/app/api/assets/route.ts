import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Asset from "@/models/Asset"
import "@/models/AssetCategory" // register schema for populate
import "@/models/Department"    // register schema for populate
import { z } from "zod"
import { logAction } from "@/lib/utils/audit"

const assetSchema = z.object({
  assetCode: z.string().min(1, "Asset code is required"),
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  departmentId: z.string().min(1, "Department is required"),
  purchaseDate: z.string().or(z.date()),
  purchasePrice: z.number().min(0),
  status: z.enum(["ACTIVE", "BROKEN", "LOST", "DISPOSED"]).optional(),
  serialNumber: z.string().optional(),
  specification: z.string().optional(),
  sourceOfFunds: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get("categoryId")
  const departmentId = searchParams.get("departmentId")
  const status = searchParams.get("status")

  await connectDB()
  const query: any = { tenantId: session.user.tenantId }
  if (categoryId) query.categoryId = categoryId
  if (departmentId) query.departmentId = departmentId
  if (status) query.status = status

  const assets = await Asset.find(query)
    .populate("categoryId", "name code")
    .populate("departmentId", "name")
    .sort({ createdAt: -1 })

  return NextResponse.json(assets)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const validatedData = assetSchema.parse(body)

    await connectDB()
    const asset = await Asset.create({
      ...validatedData,
      tenantId: session.user.tenantId,
    })

    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "CREATE",
      resourceType: "Asset",
      resourceId: asset._id as string,
      details: JSON.stringify({ name: asset.name, assetCode: asset.assetCode }),
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.message }, { status: 400 })
    }
    if (err.code === 11000) return NextResponse.json({ message: "Asset code already exists" }, { status: 400 })
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

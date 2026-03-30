import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import User from "@/models/User"
import bcrypt from "bcryptjs"
import { z } from "zod"

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "POLICY_ANALYST", "OFFICER", "EXECUTIVE"]).optional(),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
})

// GET: Get single member
export const GET = auth(async (req, { params }: { params: Promise<{ id: string }> }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { role, tenantId } = req.auth.user
  if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  await connectDB()
  const user = await User.findOne({ _id: id, tenantId }).select("-passwordHash")

  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

  return NextResponse.json(user)
})

// PUT: Update member
export const PUT = auth(async (req, { params }: { params: Promise<{ id: string }> }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { role, tenantId } = req.auth.user
  if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const validatedData = updateUserSchema.parse(body)

    await connectDB()

    const updatePayload: any = { ...validatedData }

    // Hash password if being updated
    if (validatedData.password) {
      updatePayload.passwordHash = await bcrypt.hash(validatedData.password, 10)
      delete updatePayload.password
    }

    const user = await User.findOneAndUpdate(
      { _id: id, tenantId },
      updatePayload,
      { new: true }
    ).select("-passwordHash")

    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
})

// DELETE: Deactivate member
export const DELETE = auth(async (req, { params }: { params: Promise<{ id: string }> }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { role, tenantId } = req.auth.user
  if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  // Prevent self-deletion
  if (id === req.auth.user.id) {
    return NextResponse.json({ message: "Cannot delete your own account" }, { status: 400 })
  }

  await connectDB()
  const user = await User.findOneAndUpdate(
    { _id: id, tenantId },
    { isActive: false },
    { new: true }
  ).select("-passwordHash")

  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

  return NextResponse.json({ message: "User deactivated", user })
})

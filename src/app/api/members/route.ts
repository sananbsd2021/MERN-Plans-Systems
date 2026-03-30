import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import User from "@/models/User"
import bcrypt from "bcryptjs"
import { z } from "zod"

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "POLICY_ANALYST", "OFFICER", "EXECUTIVE"]),
})

// GET: List all members for the tenant
export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { role, tenantId } = req.auth.user
  if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  await connectDB()
  const users = await User.find({ tenantId })
    .select("-passwordHash")
    .sort({ createdAt: -1 })

  return NextResponse.json(users)
})

// POST: Create a new member
export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { role, tenantId } = req.auth.user
  if (!["SUPER_ADMIN", "ADMIN"].includes(role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const validatedData = createUserSchema.parse(body)

    await connectDB()

    // Check for existing user
    const existing = await User.findOne({ email: validatedData.email })
    if (existing) {
      return NextResponse.json({ message: "Email already in use" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 10)

    const user = await User.create({
      tenantId,
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
      role: validatedData.role,
    })

    const { passwordHash: _, ...userWithoutPassword } = user.toObject()

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
})

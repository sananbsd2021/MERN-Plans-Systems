import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db/connect"
import User, { Role } from "@/models/User"
import Tenant from "@/models/Tenant"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = registerSchema.parse(body)

    await connectDB()

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email })
    if (existingUser) {
      return NextResponse.json(
        { message: "อีเมลนี้ถูกใช้งานไปแล้ว" },
        { status: 400 }
      )
    }

    // 2. Create a new Tenant
    // Generate a simple domain from organization name (can be improved)
    const domain = validatedData.organizationName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    
    const uniqueDomainPrefix = domain || "org"
    const domainExists = await Tenant.findOne({ domain: uniqueDomainPrefix })
    let uniqueDomain = uniqueDomainPrefix
    if (domainExists) {
      uniqueDomain = `${uniqueDomainPrefix}-${Math.floor(Math.random() * 1000)}`
    }

    const tenant = await Tenant.create({
      name: validatedData.organizationName,
      domain: uniqueDomain,
      isActive: true,
    })

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // 4. Create the User (as ADMIN of the new tenant)
    const user = await User.create({
      tenantId: tenant._id,
      name: validatedData.name,
      email: validatedData.email,
      passwordHash: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    })

    return NextResponse.json(
      { 
        message: "สมัครสมาชิกสำเร็จ", 
        userId: user._id, 
        tenantId: tenant._id 
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error("Registration error:", err)
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: err.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการสมัครสมาชิก" },
      { status: 500 }
    )
  }
}

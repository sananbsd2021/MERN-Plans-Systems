import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Project from "@/models/Project"
import Plan from "@/models/Plan"

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const tenantId = req.auth.user.tenantId
    await connectDB()

    // Fetch projects that have location coordinates defined
    const projects = await Project.find({
      tenantId: tenantId,
      location: { $ne: null },
      "location.coordinates": { $exists: true, $not: { $size: 0 } }
    })
    .select('name location status budgetAllocated planId')
    .populate('planId', 'title')
    .lean()

    return NextResponse.json(projects)
  } catch (error: any) {
    console.error("GET Project Locations Error:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
})

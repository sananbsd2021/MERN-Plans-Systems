import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ message: "Only PDF files are allowed" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${uuidv4()}-${file.name.replace(/ /g, "_")}`
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    
    // Ensure upload directory exists
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (e) {
      // Ignore if directory exists
    }

    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    return NextResponse.json({ 
      message: "File uploaded successfully", 
      url: `/uploads/${filename}` 
    })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ message: "Upload failed", error: error.message }, { status: 500 })
  }
}

// Max file size 10MB (informational note, actual limit is controlled by environment)

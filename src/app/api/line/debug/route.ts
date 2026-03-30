import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const LOG_FILE = path.join(process.cwd(), "tmp-line-source.json")

export async function GET() {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return NextResponse.json({ message: "No events recorded yet. Please send a message in your Line group." })
    }
    const data = fs.readFileSync(LOG_FILE, "utf-8")
    return NextResponse.json(JSON.parse(data))
  } catch (err) {
    return NextResponse.json({ error: "Failed to read log file" }, { status: 500 })
  }
}

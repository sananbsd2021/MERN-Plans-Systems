import { NextResponse } from "next/server"
import { Client, validateSignature, WebhookRequestBody } from "@line/bot-sdk"
import { connectDB } from "@/lib/db/connect"
import fs from "fs"
import path from "path"
import User from "@/models/User"
import Employee from "@/models/Employee"
import { performCheckIn, performCheckOut, getTodayRecord } from "@/lib/hrms/attendance-utils"
import { format } from "date-fns"
import { th } from "date-fns/locale"

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  channelSecret: process.env.LINE_CHANNEL_SECRET || "",
}

const client = new Client(config)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get("x-line-signature") || ""

  try {
    if (!validateSignature(body, config.channelSecret, signature)) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 })
    }
  } catch (err: unknown) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "An unexpected error occurred" }, { status: 400 })
  }

  if (!body) {
    return NextResponse.json({ message: "Empty body" }, { status: 400 })
  }

  let events: WebhookRequestBody
  try {
    events = JSON.parse(body)
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 })
  }
  
  for (const event of events.events) {
    // Log the source for debugging / finding groupId
    console.log("LINE Event Source:", JSON.stringify(event.source, null, 2))
    
    // Save for debug API
    const LOG_FILE = path.join(process.cwd(), "tmp-line-source.json")
    fs.writeFileSync(LOG_FILE, JSON.stringify({ 
      source: event.source, 
      receivedAt: new Date().toISOString() 
    }, null, 2))

    if (event.type === "message" && event.message.type === "text") {
      await handleTextMessage(event.source.userId!, event.message.text, event.replyToken)
    }
  }

  return NextResponse.json({ message: "OK" })
}

async function handleTextMessage(lineUserId: string, text: string, replyToken: string) {
  await connectDB()
  
  // 1. Find linked user
  let user = await User.findOne({ lineUserId })
  
  if (!user) {
    // Check if the user is trying to link by sending their email
    if (text.includes("@")) {
      const email = text.trim().toLowerCase()
      user = await User.findOne({ email })
      if (user) {
        user.lineUserId = lineUserId
        await user.save()
        return client.replyMessage(replyToken, {
          type: "text",
          text: `เชื่อมต่อบัญชีสำเร็จ! ยินดีต้อนรับคุณ ${user.name}\nตอนนี้คุณสามารถลงเวลาได้โดยส่งคำว่า "เข้างาน" หรือ "ออกงาน"`
        })
      } else {
        return client.replyMessage(replyToken, {
          type: "text",
          text: "ไม่พบข้อมูลผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบอีเมลอีกครั้ง"
        })
      }
    }

    return client.replyMessage(replyToken, {
      type: "text",
      text: "บัญชี LINE ของคุณยังไม่ได้เชื่อมต่อกับระบบ\nกรุณาส่ง 'อีเมล' ที่คุณใช้ลงทะเบียนในระบบเพื่อเชื่อมต่อบัญชี"
    })
  }

  const employee = await Employee.findOne({ userId: user._id })
  if (!employee) {
    return client.replyMessage(replyToken, {
      type: "text",
      text: "ไม่พบข้อมูลบุคลากรของคุณในระบบ กรุณาติดต่อธุรการ"
    })
  }

  const cleanText = text.trim()

  if (cleanText === "เข้างาน") {
    try {
      const record = await performCheckIn(user.tenantId, employee._id)
      const timeStr = format(new Date(record.checkIn), "HH:mm", { locale: th })
      return client.replyMessage(replyToken, {
        type: "text",
        text: `ลงเวลาเข้างานสำเร็จ! เวลา: ${timeStr}\nสถานะ: ${record.status === "LATE" ? "สาย" : "ปกติ"}`
      })
    } catch (err: unknown) {
      return client.replyMessage(replyToken, { type: "text", text: `ผิดพลาด: ${err instanceof Error ? err.message : "An unexpected error occurred"}` })
    }
  }

  if (cleanText === "ออกงาน") {
    try {
      const record = await performCheckOut(user.tenantId, employee._id)
      const timeStr = format(new Date(record.checkOut), "HH:mm", { locale: th })
      return client.replyMessage(replyToken, {
        type: "text",
        text: `ลงเวลาออกงานสำเร็จ! เวลา: ${timeStr}\nขอให้เดินทางกลับโดยสวัสดิภาพครับ`
      })
    } catch (err: unknown) {
      return client.replyMessage(replyToken, { type: "text", text: `ผิดพลาด: ${err instanceof Error ? err.message : "An unexpected error occurred"}` })
    }
  }

  if (cleanText === "สถานะ") {
    const record = await getTodayRecord(user.tenantId, employee._id)
    if (!record) {
      return client.replyMessage(replyToken, { type: "text", text: "คุณยังไม่ได้ลงเวลาสำหรับวันนี้" })
    }
    const checkInStr = record.checkIn ? format(new Date(record.checkIn), "HH:mm") : "-"
    const checkOutStr = record.checkOut ? format(new Date(record.checkOut), "HH:mm") : "-"
    return client.replyMessage(replyToken, {
      type: "text",
      text: `สถานะวันนี้:\nเข้างาน: ${checkInStr}\nออกงาน: ${checkOutStr}\nสถานะ: ${record.status}`
    })
  }

  // Help message
  return client.replyMessage(replyToken, {
    type: "text",
    text: `คำสั่งที่มี:\n- เข้างาน\n- ออกงาน\n- สถานะ`
  })
}

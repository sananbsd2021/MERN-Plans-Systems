import { NextResponse } from "next/server"
import { getGoogleCalendarEvents } from "@/lib/google/calendar"
import { sendLineGroupNotification } from "@/lib/line/line-notify"
import { format } from "date-fns"
import { th } from "date-fns/locale"

export async function POST() {
  try {
    const events = await getGoogleCalendarEvents()
    
    if (events.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: "No events found for today (check Google Calendar credentials if this was unexpected)" 
      })
    }

    let message = "📅 กิจกรรมสำหรับวันนี้:\n\n"
    
    // Check if these are mock events
    const hasMock = events.some(e => e.summary?.includes("(Mock Event)"))
    if (hasMock) {
      message = "⚠️ [MOCK DATA - No Credentials Found]\n" + message
    }

    events.forEach((event, index) => {
      const startTime = event.start?.dateTime || event.start?.date
      let timeStr = "ทั้งวัน"
      if (startTime) {
        const dateObj = new Date(startTime)
        if (!isNaN(dateObj.getTime())) {
          timeStr = format(dateObj, "HH:mm")
        }
      }
      message += `${index + 1}. [${timeStr}] ${event.summary}\n`
      if (event.location) message += `📍 ${event.location}\n`
    })

    message += "\nขอให้เป็นวันที่ดีครับ! ☀️"

    try {
      await sendLineGroupNotification(message)
    } catch (lineError: any) {
      console.error("Line Notification Failed:", lineError.message)
      return NextResponse.json({
        success: false,
        error: "Google Calendar data retrieved, but Line notification failed. " + 
               "Check if LINE_NOTIFY_GROUP_ID is a valid Group ID (it should not be the Access Token). " +
               "Error: " + lineError.message,
        eventsCount: events.length
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      count: events.length,
      message: "Notification sent successfully" + (hasMock ? " (using mock data)" : "")
    })
  } catch (error: any) {
    console.error("Calendar Sync Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Minimal GET for status/testing
export async function GET() {
  return NextResponse.json({ status: "Calendar Notify Job is ready" })
}

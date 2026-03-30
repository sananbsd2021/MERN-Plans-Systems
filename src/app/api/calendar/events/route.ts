import { NextResponse } from "next/server"
import { getGoogleCalendarEvents, addGoogleCalendarEvent } from "@/lib/google/calendar"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import CalendarEvent from "@/models/CalendarEvent"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const timeMin = searchParams.get("timeMin")
  const timeMax = searchParams.get("timeMax")

  try {
    await connectDB()
    
    // Fetch from Google Calendar (uses lib defaults if timeMin/timeMax are null)
    const googleEvents = await getGoogleCalendarEvents(timeMin || undefined, timeMax || undefined)
    
    // If we need to sync/merge with MongoDB, we do it here. 
    // For now, returning Google events as the primary source of truth.
    return NextResponse.json(googleEvents)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { summary, location, description, start, end } = body

    if (!summary || !start || !end) {
      return NextResponse.json({ error: "Missing required fields: summary, start, end" }, { status: 400 })
    }

    await connectDB()

    // 1. Save to MongoDB
    const newEvent = await CalendarEvent.create({
      summary,
      location,
      description,
      start: new Date(start),
      end: new Date(end),
      tenantId: session.user.tenantId
    })

    // 2. Save to Google Calendar
    try {
      const gEvent = await addGoogleCalendarEvent({
        summary,
        location,
        description,
        start,
        end,
      })
      
      // Update MongoDB with Google ID
      if (gEvent.id) {
        newEvent.googleEventId = gEvent.id
        await newEvent.save()
      }
    } catch (gError: any) {
      console.error("Google Sync Failed, but MongoDB saved:", gError.message)
      // We still return 201 because it was saved to our DB
    }

    return NextResponse.json(newEvent, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

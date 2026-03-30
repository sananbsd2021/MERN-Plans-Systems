import { google } from "googleapis"

const SCOPES = ["https://www.googleapis.com/auth/calendar"]

export async function getGoogleCalendarEvents(timeMin?: string, timeMax?: string) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  const calendarId = process.env.GOOGLE_CALENDAR_ID

  if (!email || !privateKey || !calendarId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ Google Calendar credentials missing. returning mock events for development.")
      return [
        {
          id: "mock-1",
          summary: "ประชุมทีม (Mock Event)",
          location: "ห้องประชุม A",
          start: { dateTime: new Date().toISOString() },
          end: { dateTime: new Date(Date.now() + 3600000).toISOString() }
        },
        {
          id: "mock-2",
          summary: "ส่งงานลูกค้า (Mock Event)",
          start: { dateTime: new Date(Date.now() + 7200000).toISOString() },
          end: { dateTime: new Date(Date.now() + 10800000).toISOString() }
        }
      ]
    }
    console.warn("⚠️ Google Calendar credentials missing. Returning empty events list.")
    return []
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: SCOPES,
  })
  const calendar = google.calendar({ version: "v3", auth })

  // If no range is provided, default to the entire current day in Asia/Bangkok (GMT+7)
  const now = new Date()
  
  // Calculate start of today in Bangkok (GMT+7)
  const bangkokOffset = 7 * 60
  const startOfDay = new Date(now.getTime() + (bangkokOffset * 60 * 1000))
  startOfDay.setUTCHours(0, 0, 0, 0)
  startOfDay.setTime(startOfDay.getTime() - (bangkokOffset * 60 * 1000))

  // Calculate end of today in Bangkok
  const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1)

  const finalTimeMin = timeMin || startOfDay.toISOString()
  const finalTimeMax = timeMax || endOfDay.toISOString()

  const response = await calendar.events.list({
    calendarId: calendarId,
    timeMin: finalTimeMin,
    timeMax: finalTimeMax,
    singleEvents: true,
    orderBy: "startTime",
  })

  return response.data.items || []
}

export async function addGoogleCalendarEvent(eventData: {
  summary: string
  location?: string
  description?: string
  start: string
  end: string
}) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  const calendarId = process.env.GOOGLE_CALENDAR_ID

  if (!email || !privateKey || !calendarId) {
    console.warn("⚠️ Google Calendar credentials missing. Cannot add event to Google.")
    return { id: "mock-google-id-" + Date.now() }
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: SCOPES,
  })
  const calendar = google.calendar({ version: "v3", auth })

  const response = await calendar.events.insert({
    calendarId: calendarId,
    requestBody: {
      summary: eventData.summary,
      location: eventData.location,
      description: eventData.description,
      start: { dateTime: eventData.start, timeZone: "Asia/Bangkok" },
      end: { dateTime: eventData.end, timeZone: "Asia/Bangkok" },
    },
  })

  return response.data
}

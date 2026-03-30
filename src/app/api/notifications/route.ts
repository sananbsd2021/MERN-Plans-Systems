import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Notification from "@/models/Notification"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    await connectDB()

    const notifications = await Notification.find({ 
      tenantId: session.user.tenantId,
      userId: session.user.id
    }).sort({ createdAt: -1 }).limit(50)

    return NextResponse.json(notifications)
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const { id, isRead } = await req.json()
    await connectDB()

    if (id === "all") {
        await Notification.updateMany(
            { userId: session.user.id, tenantId: session.user.tenantId },
            { isRead: true }
        )
        return NextResponse.json({ message: "All notifications marked as read" })
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { isRead },
      { new: true }
    )

    return NextResponse.json(notification)
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}

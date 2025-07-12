import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { userId, itemId, status, itemTitle } = await request.json()

    if (!userId || !itemId || !status || !itemTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", userId)
      .single()

    if (userError || !user?.email) {
      console.warn(`User with ID ${userId} not found or has no email for notification.`)
      return NextResponse.json({ message: "User not found or no email", sent: false }, { status: 200 })
    }

    const subject = `Your ReWear item "${itemTitle}" has been ${status}`
    const body =
      status === "approved"
        ? `Great news! Your item "${itemTitle}" has been approved and is now live on ReWear. You've earned points for this listing!`
        : status === "rejected"
          ? `Important update: Your item "${itemTitle}" was rejected. Please review our guidelines or contact support for more details.`
          : `Your item "${itemTitle}" status has changed to ${status}.`

    // Placeholder – integrate your real email service here
    console.log(`
    --- EMAIL NOTIFICATION ---
    To: ${user.email}
    Subject: ${subject}
    Body: ${body}
    --------------------------
    `)

    return NextResponse.json({ message: "Notification processed (logged to console)", sent: true }, { status: 200 })
  } catch (error) {
    console.error("Error sending item status notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Firebase client-side sign out is usually sufficient.
    // This route is primarily for clearing any server-side cookies if they were set.
    // For Firebase, we typically don't manage sessions with server-side cookies
    // unless using the Admin SDK for SSR.
    // For now, we'll just return a success response.
    return NextResponse.json({ message: "Signed out successfully" }, { status: 200 })
  } catch (error) {
    console.error("Sign-out error:", error)
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 })
  }
}

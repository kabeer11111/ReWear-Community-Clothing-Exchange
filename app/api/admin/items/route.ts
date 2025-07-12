import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server" // For regular user checks
import { createAdminSupabaseClient } from "@/lib/supabase/admin" // For admin operations

// Helper to check if the current user is an admin (remains the same, uses regular client)
async function checkAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: authUser, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) {
    throw new Error("Authentication required")
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.user.id)
    .single()
  if (userError || userData?.role !== "admin") {
    throw new Error("Admin access required")
  }
  return true
}

export async function GET() {
  try {
    const supabase = await createClient()
    await checkAdmin(supabase) // Ensure only admins can access

    const { data: items, error } = await supabase
      .from("items")
      .select(
        `
        *,
        user:users(full_name, email)
      `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching pending items:", error)
      return NextResponse.json({ error: "Failed to fetch pending items" }, { status: 500 })
    }

    return NextResponse.json(items)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes("Authentication") ? 401 : 403 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const regularSupabase = await createClient() // Use regular client for admin check
    await checkAdmin(regularSupabase) // Ensure only admins can access

    const adminSupabase = createAdminSupabaseClient() // Use admin client for the actual update

    const { itemId, status } = await request.json()

    if (!itemId || !status) {
      return NextResponse.json({ error: "Item ID and status are required" }, { status: 400 })
    }

    // Fetch existing item using admin client to bypass RLS for this internal check
    const { data: existingItem, error: fetchError } = await adminSupabase
      .from("items")
      .select("id, user_id, title, points_value")
      .eq("id", itemId)
      .single()

    if (fetchError || !existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const { data: updatedItem, error: updateError } = await adminSupabase // Use adminSupabase here
      .from("items")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", itemId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating item status:", updateError)
      return NextResponse.json({ error: "Failed to update item status" }, { status: 500 })
    }

    // Award points for approved items using the SQL function (still uses regular client, which is fine as it's an RPC call)
    if (status === "approved") {
      const { error: pointsError } = await regularSupabase.rpc("update_user_points", {
        user_id: existingItem.user_id,
        amount: existingItem.points_value,
        transaction_type: "earned",
        description: `Item approved: ${existingItem.title}`,
      })
      if (pointsError) console.error("Error updating user points:", pointsError)

      // Conceptual email notification for approval
      console.log(
        `[EMAIL NOTIFICATION] Item "${existingItem.title}" (ID: ${existingItem.id}) approved for user ${existingItem.user_id}.`,
      )
    } else if (status === "rejected") {
      // Conceptual email notification for rejection
      console.log(
        `[EMAIL NOTIFICATION] Item "${existingItem.title}" (ID: ${existingItem.id}) rejected for user ${existingItem.user_id}.`,
      )
    }

    return NextResponse.json(updatedItem)
  } catch (error: any) {
    console.error("Unexpected error in PATCH /api/admin/items:", error)
    return NextResponse.json({ error: error.message }, { status: error.message.includes("Authentication") ? 401 : 403 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminSupabase = createAdminSupabaseClient() // Use the admin client for deleting items
    const regularSupabase = await createClient() // Use regular client for admin check
    await checkAdmin(regularSupabase) // Ensure only admins can access

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    const { error } = await adminSupabase.from("items").delete().eq("id", itemId) // Use adminSupabase here

    if (error) {
      console.error("Error deleting item:", error)
      return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
    }

    return NextResponse.json({ message: "Item deleted successfully" })
  } catch (error: any) {
    console.error("Unexpected error in DELETE /api/admin/items:", error)
    return NextResponse.json({ error: error.message }, { status: error.message.includes("Authentication") ? 401 : 403 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server" // For regular user checks
import { createAdminSupabaseClient } from "@/lib/supabase/admin" // For admin operations
import type { UserRole } from "@/lib/types"

// Helper to check if the current user is an admin
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    await checkAdmin(supabase) // Ensure only admins can access

    const { data: users, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes("Authentication") ? 401 : 403 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    await checkAdmin(supabase) // Ensure only admins can access

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and role are required" }, { status: 400 })
    }

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({ role: role as UserRole, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating user role:", error)
      return NextResponse.json({ error: "Failed to update user role" }, { status: 500 })
    }

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes("Authentication") ? 401 : 403 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient() // Use the admin client for deleting users
    const regularSupabase = await createClient() // Use regular client for admin check
    await checkAdmin(regularSupabase) // Ensure only admins can access

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Delete user from auth.users table, which should cascade delete to public.users
    // due to the foreign key with ON DELETE CASCADE.
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error("Error deleting user from auth:", authDeleteError)
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes("Authentication") ? 401 : 403 })
  }
}

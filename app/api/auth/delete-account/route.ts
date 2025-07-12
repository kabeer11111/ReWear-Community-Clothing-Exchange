import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server" // Import the regular server client
import { createAdminSupabaseClient } from "@/lib/supabase/admin" // Import the admin client

export async function DELETE(request: Request) {
  try {
    // Use the regular server client to get the authenticated user from the request's session
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Now use the admin client to perform the deletion with service_role key
    const adminSupabase = createAdminSupabaseClient()
    const { error: deleteAuthUserError } = await adminSupabase.auth.admin.deleteUser(user.id)

    if (deleteAuthUserError) {
      console.error("Error deleting auth user:", deleteAuthUserError)
      return NextResponse.json({ error: "Failed to delete user account" }, { status: 500 })
    }

    // The RLS policy on public.users table with ON DELETE CASCADE on the foreign key
    // from public.users to auth.users should handle deleting the user's profile
    // and associated data (items, swaps, transactions).

    // Sign out the user from the client side (handled by client-side logic after this API call)
    const response = NextResponse.json({ success: true, message: "Account deleted successfully" })
    // Clear Supabase session cookies (optional, client-side signOut should handle this)
    response.cookies.delete("sb-access-token")
    response.cookies.delete("sb-refresh-token")

    return response
  } catch (error) {
    console.error("Unexpected error in DELETE /api/auth/delete-account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

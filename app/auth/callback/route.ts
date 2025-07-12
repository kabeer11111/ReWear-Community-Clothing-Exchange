import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { data: authSession, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && authSession.user) {
      // Check if user exists in public.users table, if not, create it.
      // This acts as a fallback if the 'on_auth_user_created' trigger is delayed or fails.
      const { data: userData, error: userFetchError } = await supabase
        .from("users")
        .select("id")
        .eq("id", authSession.user.id)
        .single()

      if (userFetchError || !userData) {
        console.log("User not found in public.users, creating entry...")
        const { error: insertError } = await supabase.from("users").insert({
          id: authSession.user.id,
          email: authSession.user.email || "",
          full_name: authSession.user.user_metadata?.full_name || null,
          avatar_url: authSession.user.user_metadata?.avatar_url || null,
          points: 100, // Default points for new users
          role: "user", // Default role
        })

        if (insertError) {
          console.error("Error inserting user into public.users:", insertError)
          // Redirect to an error page or handle gracefully if user profile creation fails
          return NextResponse.redirect(`${origin}/auth?error=Failed to create user profile`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth?error=Could not authenticate user`)
}

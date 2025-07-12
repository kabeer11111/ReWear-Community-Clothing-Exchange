import { createClient as createAdminClient } from "@supabase/supabase-js"

export function createAdminSupabaseClient() {
  // Ensure these environment variables are set in your Vercel project
  // and are NOT prefixed with NEXT_PUBLIC_
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // Supabase URL is the same
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // This is the secret service role key
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

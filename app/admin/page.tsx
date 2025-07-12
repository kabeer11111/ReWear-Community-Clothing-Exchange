import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AdminPanel } from "@/components/admin/admin-panel"
import type { User } from "@/lib/types"

async function checkAdminAuth(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log("AdminPage: No authenticated user found. Redirecting to /auth.")
    redirect("/auth")
  }

  const { data: userData, error } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (error || userData?.role !== "admin") {
    console.log(
      `AdminPage: User ${user.id} (email: ${user.email}) is not an admin. Role detected: ${
        userData?.role || "null"
      }. Redirecting to /dashboard.`,
    )
    redirect("/dashboard") // Redirect non-admins to dashboard
  }

  console.log(`AdminPage: User ${user.id} (email: ${user.email}) is an admin. Access granted.`)
  return { ...user, role: userData.role } as User // Return user with role
}

export default async function AdminPage() {
  const adminUser = await checkAdminAuth()

  if (!adminUser) {
    // This case should be handled by redirect in checkAdminAuth, but for type safety
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
          <p className="text-lg text-muted-foreground">Manage items, users, and platform settings.</p>
        </div>

        <AdminPanel />
      </div>

      <Footer />
    </div>
  )
}

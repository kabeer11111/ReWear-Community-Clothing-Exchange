import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { NewItemForm } from "@/components/items/new-item-form"

async function checkAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  return user
}

export default async function NewItemPage() {
  await checkAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">List a New Item</h1>
            <p className="text-lg text-muted-foreground">
              Share your pre-loved clothing with the community and earn points for successful swaps.
            </p>
          </div>

          <NewItemForm />
        </div>
      </div>

      <Footer />
    </div>
  )
}

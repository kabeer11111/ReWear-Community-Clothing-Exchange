import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Recycle } from "lucide-react"
import type { Item, User } from "@/lib/types"

async function getApprovedItems(): Promise<(Item & { user: User | null })[]> {
  const supabase = await createClient()
  const { data: items, error } = await supabase
    .from("items")
    .select(
      `
      *,
      user:users(full_name, avatar_url)
    `,
    )
    .eq("status", "approved")
    .eq("is_available", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching approved items:", error)
    return []
  }
  return items || []
}

export default async function BrowsePage() {
  const items = await getApprovedItems()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Browse All Items</h1>
          <p className="text-lg text-muted-foreground">Discover pre-loved clothing from our community.</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Recycle className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">No items available yet!</h2>
            <p className="text-muted-foreground mb-6">Check back later or be the first to list an item.</p>
            <Button asChild>
              <Link href="/items/new">List Your Item</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted">
                  {item.images[0] ? (
                    <img
                      src={item.images[0] || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Recycle className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg truncate">{item.title}</h3>
                    <Badge variant="secondary">{item.points_value} pts</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Size: {item.size} • {item.condition.replace("_", " ")}
                  </p>
                  <p className="text-sm text-muted-foreground">by {item.user?.full_name || "Anonymous"}</p>
                  <Button asChild size="sm" className="mt-4 w-full">
                    <Link href={`/items/${item.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

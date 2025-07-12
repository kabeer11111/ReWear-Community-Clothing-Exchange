import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Package, DollarSign } from "lucide-react"
import type { Item, User as UserType } from "@/lib/types"
import Link from "next/link"

interface ItemDetailPageProps {
  params: {
    id: string
  }
}

async function getItemDetails(itemId: string): Promise<(Item & { user: UserType | null }) | null> {
  const supabase = await createClient()

  const { data: item, error } = await supabase
    .from("items")
    .select(
      `
      *,
      user:users(id, full_name, email, avatar_url, points)
    `,
    )
    .eq("id", itemId)
    .single()

  if (error) {
    console.error("Error fetching item details:", error)
    return null
  }

  return item
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const supabase = await createClient()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  const item = await getItemDetails(params.id)

  if (!item) {
    notFound()
  }

  // Redirect if item is not approved and current user is not the owner or admin
  if (item.status !== "approved" && currentUser?.id !== item.user_id && currentUser?.role !== "admin") {
    redirect("/browse") // Or show a "pending approval" message
  }

  const isOwner = currentUser?.id === item.user_id
  const isAvailable = item.is_available && item.status === "approved"

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {item.images && item.images.length > 0 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {item.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="aspect-square w-full">
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`${item.title} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute left-2" />
                  <CarouselNext className="absolute right-2" />
                </Carousel>
              ) : (
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Item Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-3xl font-bold">{item.title}</CardTitle>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {item.points_value} pts
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={item.status === "approved" ? "default" : "secondary"}>
                    Status: {item.status.replace("_", " ")}
                  </Badge>
                  <Badge variant={item.is_available ? "default" : "secondary"}>
                    Availability: {item.is_available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{item.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Category:</p>
                    <p className="text-muted-foreground">{item.category}</p>
                  </div>
                  <div>
                    <p className="font-medium">Type:</p>
                    <p className="text-muted-foreground">{item.type}</p>
                  </div>
                  <div>
                    <p className="font-medium">Size:</p>
                    <p className="text-muted-foreground">{item.size}</p>
                  </div>
                  <div>
                    <p className="font-medium">Condition:</p>
                    <p className="text-muted-foreground">{item.condition.replace("_", " ")}</p>
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="col-span-2">
                      <p className="font-medium">Tags:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Uploader Info */}
            <Card>
              <CardHeader>
                <CardTitle>Listed by</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={item.user?.avatar_url || ""} alt={item.user?.full_name || ""} />
                  <AvatarFallback>{item.user?.full_name?.charAt(0) || item.user?.email?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{item.user?.full_name || "Anonymous User"}</p>
                  <p className="text-sm text-muted-foreground">{item.user?.email}</p>
                  <Badge variant="secondary" className="mt-1">
                    {item.user?.points} points
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {!isOwner && isAvailable && currentUser && (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="flex-1">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Redeem via Points
                </Button>
                <Button size="lg" variant="outline" className="flex-1 bg-transparent">
                  <Package className="mr-2 h-5 w-5" />
                  Swap Request
                </Button>
              </div>
            )}
            {!currentUser && (
              <div className="text-center text-muted-foreground">
                <p>Sign in to make a swap request or redeem this item.</p>
                <Button asChild className="mt-4">
                  <Link href="/auth">Sign In</Link>
                </Button>
              </div>
            )}
            {isOwner && (
              <div className="text-center text-muted-foreground">
                <p>This is your item. You cannot swap with yourself.</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard">Manage Your Items</Link>
                </Button>
              </div>
            )}
            {!isAvailable && !isOwner && (
              <div className="text-center text-muted-foreground">
                <p>This item is currently unavailable for swap or redemption.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

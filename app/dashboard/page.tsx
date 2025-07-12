import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Plus, Package, ArrowUpDown, Award, TrendingUp, Clock, CheckCircle } from "lucide-react"
import type { Item, Swap, PointsTransaction, User } from "@/lib/types"

async function getUserData(): Promise<{
  user: User | null
  items: Item[]
  swaps: Swap[]
  transactions: PointsTransaction[]
  error: string | null // Added error field
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("Dashboard: Auth User from Supabase:", user ? user.id : "null")

  if (!user) {
    // This case should ideally be caught by middleware, but as a fallback
    return { user: null, items: [], swaps: [], transactions: [], error: "User not authenticated." }
  }

  const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (userError) {
    console.error("Dashboard: Error fetching user data from public.users:", userError.message)
  } else if (!userData) {
    console.warn("Dashboard: User data not found in public.users for ID:", user?.id)
  } else {
    console.log("Dashboard: User data from public.users:", userData.id, userData.email, "Role:", userData.role)
  }

  if (userError || !userData) {
    console.error("Error fetching user data:", userError?.message || "User data not found in public.users.")
    // Instead of redirecting, return an error state.
    return {
      user: null,
      items: [],
      swaps: [],
      transactions: [],
      error: "Failed to load user profile. Please try again.",
    }
  }

  const { data: userItems, error: itemsError } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  if (itemsError) console.error("Error fetching user items:", itemsError)

  const { data: userSwaps, error: swapsError } = await supabase
    .from("swaps")
    .select(
      `
      *,
      item:items!swaps_item_id_fkey(title, images),
      offered_item:items!swaps_offered_item_id_fkey(title, images),
      requester:users!swaps_requester_id_fkey(full_name),
      owner:users!swaps_owner_id_fkey(full_name)
    `,
    )
    .or(`requester_id.eq.${user.id},owner_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
  if (swapsError) console.error("Error fetching user swaps:", swapsError)

  const { data: recentTransactions, error: transactionsError } = await supabase
    .from("points_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)
  if (transactionsError) console.error("Error fetching recent transactions:", transactionsError)

  return {
    user: userData,
    items: userItems || [],
    swaps: userSwaps || [],
    transactions: recentTransactions || [],
    error: null,
  }
}

export default async function DashboardPage() {
  const { user, items, swaps, transactions, error } = await getUserData()

  if (error) {
    // If there's an error, display a message and a button to retry or sign in
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
          <Card className="w-full max-w-md text-center p-6">
            <CardHeader>
              <CardTitle>Error Loading Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <Button asChild>
                <Link href="/auth">Sign In / Retry</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  // If user is null but no explicit error, it means auth.getUser() returned null.
  // This should be handled by middleware, but as a final fallback, redirect.
  if (!user) {
    redirect("/auth")
  }

  const stats = {
    totalItems: items.length,
    activeItems: items.filter((item) => item.is_available).length,
    completedSwaps: swaps.filter((swap) => swap.status === "completed").length,
    pendingSwaps: swaps.filter((swap) => swap.status === "pending").length,
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatar_url || ""} alt={user?.full_name || ""} />
              <AvatarFallback className="text-lg">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.full_name || "User"}!</h1>
              <p className="text-muted-foreground">Manage your items and track your swaps</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Award className="h-4 w-4 mr-2" />
              {user?.points} points
            </Badge>
            <Button asChild>
              <Link href="/items/new">
                <Plus className="h-4 w-4 mr-2" />
                List Item
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <p className="text-xs text-muted-foreground">{stats.activeItems} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Swaps</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedSwaps}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Swaps</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingSwaps}</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.points}</div>
              <p className="text-xs text-muted-foreground">Available to spend</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList>
            <TabsTrigger value="items">My Items</TabsTrigger>
            <TabsTrigger value="swaps">Swaps</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Listed Items</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="aspect-square bg-muted">
                          {item.images[0] ? (
                            <img
                              src={item.images[0] || "/placeholder.svg"}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold truncate">{item.title}</h3>
                            <Badge variant={item.status === "approved" ? "default" : "secondary"}>{item.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.points_value} points • {item.condition}
                          </p>
                          <Badge variant={item.is_available ? "default" : "secondary"}>
                            {item.is_available ? "Available" : "Unavailable"}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No items listed yet</h3>
                    <p className="text-muted-foreground mb-4">Start by listing your first item to earn points!</p>
                    <Button asChild>
                      <Link href="/items/new">
                        <Plus className="h-4 w-4 mr-2" />
                        List Your First Item
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="swaps" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Swaps</CardTitle>
              </CardHeader>
              <CardContent>
                {swaps.length > 0 ? (
                  <div className="space-y-4">
                    {swaps.map((swap) => (
                      <div key={swap.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {swap.requester_id === user?.id ? "You requested" : "Request from"}{" "}
                              {swap.requester_id === user?.id ? swap.owner?.full_name : swap.requester?.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {swap.item?.title} {swap.offered_item && `for ${swap.offered_item.title}`}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            swap.status === "completed"
                              ? "default"
                              : swap.status === "pending"
                                ? "secondary"
                                : swap.status === "accepted"
                                  ? "default"
                                  : "destructive"
                          }
                        >
                          {swap.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ArrowUpDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No swaps yet</h3>
                    <p className="text-muted-foreground mb-4">Browse items to start your first swap!</p>
                    <Button asChild>
                      <Link href="/browse">Browse Items</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{transaction.description || transaction.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={transaction.amount > 0 ? "default" : "secondary"}>
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount} points
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                    <p className="text-muted-foreground">Your point transactions will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}

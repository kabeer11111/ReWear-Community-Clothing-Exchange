"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, XCircle, Trash2, Package } from "lucide-react"
import type { Item, User as UserType } from "@/lib/types"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export function AdminPanel() {
  const [pendingItems, setPendingItems] = useState<Item[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchPendingItems()
    fetchUsers()
  }, [])

  const fetchPendingItems = async () => {
    setLoadingItems(true)
    try {
      const response = await fetch("/api/admin/items")
      if (!response.ok) {
        throw new Error("Failed to fetch pending items")
      }
      const data = await response.json()
      setPendingItems(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingItems(false)
    }
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }
      const data = await response.json()
      setUsers(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleItemStatusChange = async (itemId: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch("/api/admin/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, status }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${status} item`)
      }

      toast({
        title: "Success",
        description: `Item ${status} successfully.`,
      })
      fetchPendingItems() // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleItemDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/admin/items?itemId=${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete item")
      }

      toast({
        title: "Success",
        description: "Item deleted successfully.",
      })
      fetchPendingItems() // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleUserRoleChange = async (userId: string, newRole: UserType["role"]) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (!response.ok) {
        throw new Error("Failed to update user role")
      }

      toast({
        title: "Success",
        description: `User role updated to ${newRole}.`,
      })
      fetchUsers() // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleUserDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will delete all their items and data.")) {
      return
    }
    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      toast({
        title: "Success",
        description: "User and associated data deleted successfully.",
      })
      fetchUsers() // Refresh the list
      fetchPendingItems() // Also refresh items in case user had pending items
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <Tabs defaultValue="items" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 md:w-auto">
        <TabsTrigger value="items">Pending Items</TabsTrigger>
        <TabsTrigger value="users">User Management</TabsTrigger>
      </TabsList>

      <TabsContent value="items" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Items Awaiting Approval</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingItems ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No items currently awaiting approval.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingItems.map((item) => (
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
                      <h3 className="font-semibold text-lg truncate">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        by {item.user?.full_name || item.user?.email || "Unknown User"}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {item.points_value} points • {item.condition}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => handleItemStatusChange(item.id, "approved")}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => handleItemStatusChange(item.id, "rejected")}
                        >
                          <XCircle className="h-4 w-4 mr-2" /> Reject
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleItemDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users found.</div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || ""} alt={user.full_name || ""} />
                        <AvatarFallback>{user.full_name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <Badge variant="secondary" className="mt-1">
                          {user.points} points
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.role === "admin" ? "destructive" : "outline"}>{user.role}</Badge>
                      {user.role === "user" ? (
                        <Button size="sm" onClick={() => handleUserRoleChange(user.id, "admin")}>
                          Make Admin
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleUserRoleChange(user.id, "user")}>
                          Make User
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleUserDelete(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

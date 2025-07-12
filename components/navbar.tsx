"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileNav } from "@/components/mobile-nav"
import { Recycle, User, Settings, LogOut, Plus, Search, Shield, Trash2 } from "lucide-react"
import type { User as UserType } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function Navbar() {
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Set up the auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true) // Start loading when auth state changes
      if (session?.user) {
        // When signed in, fetch the full user profile from public.users
        const { data: userData, error: userFetchError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (userFetchError || !userData) {
          console.warn("User data not found in public.users, falling back to auth.user data:", userFetchError?.message)
          // Fallback to auth.user data if public.users data is not ready
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            full_name: session.user.user_metadata?.full_name || null,
            avatar_url: session.user.user_metadata?.avatar_url || null,
            points: 0, // Default until actual points are fetched
            role: "user", // Default until actual role is fetched
            created_at: session.user.created_at,
            updated_at: session.user.updated_at,
          })
        } else {
          setUser(userData)
        }
      } else {
        setUser(null) // Clear user if signed out
      }
      setLoading(false) // End loading
    })

    // Initial check for current session (optional, as onAuthStateChange will fire)
    // This ensures the UI is correct on first load without waiting for the listener's first fire
    const checkInitialUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (authUser) {
        const { data: userData, error: userFetchError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single()
        if (userFetchError || !userData) {
          setUser({
            id: authUser.id,
            email: authUser.email || "",
            full_name: authUser.user_metadata?.full_name || null,
            avatar_url: authUser.user_metadata?.avatar_url || null,
            points: 0,
            role: "user",
            created_at: authUser.created_at,
            updated_at: authUser.updated_at,
          })
        } else {
          setUser(userData)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }
    checkInitialUser()

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      // setUser(null) // State will be updated by onAuthStateChange listener
      router.push("/")
      // router.refresh() // Removed to prevent full page reload
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete account")
      }

      await supabase.auth.signOut()
      // setUser(null) // State will be updated by onAuthStateChange listener
      router.push("/")
      // router.refresh() // Removed to prevent full page reload
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <MobileNav user={user} onSignOut={handleSignOut} />
            <Link href="/" className="flex items-center space-x-2">
              <Recycle className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">ReWear</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/browse" className="text-sm font-medium transition-colors hover:text-primary">
              Browse Items
            </Link>
            <Link href="/how-it-works" className="text-sm font-medium transition-colors hover:text-primary">
              How It Works
            </Link>
            <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
              About
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <>
                <Badge variant="secondary" className="hidden sm:flex">
                  {user.points} points
                </Badge>
                <Button asChild size="sm" className="hidden sm:flex">
                  <Link href="/items/new">
                    <Plus className="h-4 w-4 mr-2" />
                    List Item
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || ""} alt={user.full_name || ""} />
                        <AvatarFallback>{user.full_name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.full_name || "User"}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {user.points} points
                          </Badge>
                          {user.role === "admin" && (
                            <Badge variant="destructive" className="text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/browse">
                        <Search className="mr-2 h-4 w-4" />
                        Browse Items
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDeleteAccount} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" asChild size="sm">
                  <Link href="/auth">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

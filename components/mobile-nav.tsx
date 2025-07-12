"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Recycle, User, Settings, LogOut, Plus, Search, Shield, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User as UserType } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface MobileNavProps {
  user: UserType | null
  onSignOut: () => void
}

export function MobileNav({ user, onSignOut }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return
    }

    try {
      // Call the API route to handle server-side deletion
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete account")
      }

      // Sign out client-side after server deletion
      await supabase.auth.signOut()
      setIsOpen(false)
      router.push("/")
      router.refresh()
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild className="md:hidden mr-4">
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <div className="flex flex-col h-full">
          <Link href="/" className="flex items-center space-x-2 mb-6" onClick={() => setIsOpen(false)}>
            <Recycle className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">ReWear</span>
          </Link>

          {user && (
            <div className="flex items-center space-x-3 mb-6 p-2 border-b pb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar_url || ""} alt={user.full_name || ""} />
                <AvatarFallback>{user.full_name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="font-medium">{user.full_name || "User"}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center space-x-2 mt-1">
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
          )}

          <nav className="grid gap-4 text-lg font-medium flex-grow">
            <Link
              href="/browse"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              <Search className="h-5 w-5" />
              Browse Items
            </Link>
            <Link
              href="/how-it-works"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Dashboard
                </Link>
                <Link
                  href="/items/new"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  <Plus className="h-5 w-5" />
                  List Item
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    <Shield className="h-5 w-5" />
                    Admin Panel
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  <LogOut className="h-5 w-5" />
                  Sign In / Get Started
                </Link>
              </>
            )}
          </nav>

          {user && (
            <div className="mt-auto pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Delete Account
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onSignOut()
                  setIsOpen(false)
                }}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sign out
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

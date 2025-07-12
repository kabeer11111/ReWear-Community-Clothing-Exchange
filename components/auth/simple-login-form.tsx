"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function SimpleLoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      })
      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#f0f0f0] dark:bg-[#1a1a1a] p-4">
      {/* Top Left Logo */}
      <div className="absolute top-8 left-8 flex items-center space-x-2 text-lg font-semibold text-[#333] dark:text-[#eee]">
        <span className="h-4 w-4 rounded-full bg-[#333] dark:bg-[#eee]" />
        <span>new.email</span>
      </div>

      {/* Top Right Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-8 right-8 rounded-full bg-gray-200/50 hover:bg-gray-300/50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50"
        onClick={() => router.back()} // Or redirect to a specific page
      >
        <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        <span className="sr-only">Close</span>
      </Button>

      <div className="w-full max-w-md bg-white dark:bg-[#2a2a2a] p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-2 text-[#333] dark:text-[#eee]">Log in to your account</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Don't have an account?{" "}
          <Link href="/auth?tab=signup" className="text-primary hover:underline">
            Sign up.
          </Link>
        </p>

        <div className="space-y-6">
          <div className="text-left">
            <Label htmlFor="email" className="text-[#333] dark:text-[#eee]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 bg-[#f8f8f8] dark:bg-[#3a3a3a] border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-[#333] dark:text-[#eee]"
              required
            />
          </div>
          <div className="text-left">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-[#333] dark:text-[#eee]">
                Password
              </Label>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 bg-[#f8f8f8] dark:bg-[#3a3a3a] border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-[#333] dark:text-[#eee]"
              required
            />
          </div>
          <Button
            className="w-full bg-[#1a1a1a] text-white hover:bg-[#333] dark:bg-[#eee] dark:text-[#1a1a1a] dark:hover:bg-[#ccc]"
            onClick={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
          </Button>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="absolute bottom-8 text-sm text-muted-foreground">
        Brought to you by <span className="font-semibold text-[#333] dark:text-[#eee]">Resend</span>
      </div>
    </div>
  )
}

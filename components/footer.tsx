import Link from "next/link"
import { Recycle } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t py-8 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto flex flex-col items-center text-center gap-4">
        <Link href="/" className="flex items-center space-x-2">
          <Recycle className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">ReWear</span>
        </Link>
        <p className="text-muted-foreground text-sm max-w-md">
          Sustainable fashion through community exchange. Give your clothes a second life.
        </p>

        <div className="flex space-x-4 mt-4">
          {/* Placeholder for social media icons */}
          <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
            Facebook
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
            Instagram
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
            Twitter
          </Link>
        </div>
      </div>
      <div className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ReWear. All rights reserved.
      </div>
    </footer>
  )
}

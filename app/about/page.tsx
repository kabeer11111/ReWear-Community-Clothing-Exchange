import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Recycle, Users, Leaf, Heart } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About ReWear</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our mission is to revolutionize fashion by making it sustainable, accessible, and community-driven.
          </p>
        </div>

        <section className="grid md:grid-cols-2 gap-12 items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-4">Our Story</h2>
            <p className="text-lg text-muted-foreground mb-4">
              ReWear was born out of a passion for sustainable living and a desire to combat fast fashion's impact on
              our planet. We believe that fashion can be both stylish and responsible. Our founders, a group of
              environmental enthusiasts and tech innovators, envisioned a platform where clothing could find new homes,
              reducing waste and fostering a vibrant community.
            </p>
            <p className="text-lg text-muted-foreground">
              From a small idea, ReWear has grown into a thriving community of individuals committed to making a
              difference, one swap at a time. We're constantly evolving, driven by our users' feedback and our shared
              commitment to a circular economy.
            </p>
          </div>
          <div className="flex justify-center">
            <img
              src="/placeholder.svg?height=400&width=600"
              alt="Our Story"
              className="rounded-lg shadow-lg object-cover w-full max-w-md"
            />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Our Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 border rounded-lg shadow-sm">
              <Recycle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sustainability</h3>
              <p className="text-muted-foreground">
                We champion circular fashion to minimize waste and environmental impact.
              </p>
            </div>
            <div className="text-center p-6 border rounded-lg shadow-sm">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-muted-foreground">
                We foster a supportive and engaging environment for fashion enthusiasts.
              </p>
            </div>
            <div className="text-center p-6 border rounded-lg shadow-sm">
              <Leaf className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Transparency</h3>
              <p className="text-muted-foreground">
                We are committed to clear processes and honest interactions within our platform.
              </p>
            </div>
            <div className="text-center p-6 border rounded-lg shadow-sm">
              <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Innovation</h3>
              <p className="text-muted-foreground">
                We continuously seek new ways to improve the swapping experience and promote eco-friendly practices.
              </p>
            </div>
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Movement</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Be a part of the change. Together, we can make fashion more sustainable and create a positive impact on the
            world.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Get Started Today
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  )
}

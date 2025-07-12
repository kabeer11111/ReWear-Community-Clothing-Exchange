import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Users, Award, Package, Handshake, CheckCircle, Search } from "lucide-react"

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">How ReWear Works</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple steps to refresh your closet, earn points, and contribute to a greener planet.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="text-center p-6 shadow-lg">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold mb-2">1. List Your Items</CardTitle>
              <CardDescription>
                Upload clear photos and detailed descriptions of clothing items you no longer wear. Specify condition,
                size, and category.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center p-6 shadow-lg">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold mb-2">2. Get Approved & Earn Points</CardTitle>
              <CardDescription>
                Our community moderators review your listing. Once approved, your item goes live, and you earn ReWear
                points!
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center p-6 shadow-lg">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold mb-2">3. Browse & Discover</CardTitle>
              <CardDescription>
                Explore thousands of unique, pre-loved items listed by other community members. Find your next favorite
                piece!
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center p-6 shadow-lg">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Handshake className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold mb-2">4. Request a Swap</CardTitle>
              <CardDescription>
                See something you like? Use your earned points to request a swap. You can offer points or another item.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center p-6 shadow-lg">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold mb-2">5. Connect & Exchange</CardTitle>
              <CardDescription>
                Once a swap is accepted, connect with the other user to arrange the exchange. Safe and secure!
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center p-6 shadow-lg">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold mb-2">6. Enjoy & Repeat</CardTitle>
              <CardDescription>
                Enjoy your new wardrobe additions! The more you swap, the more points you earn, and the more you
                contribute to circular fashion.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <h2 className="text-3xl font-bold mb-4">Why Sustainable Fashion?</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            The fashion industry is one of the most polluting in the world. By participating in clothing exchange, you
            help reduce textile waste, conserve resources, and lessen your environmental footprint. Join ReWear and be
            part of the solution!
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}

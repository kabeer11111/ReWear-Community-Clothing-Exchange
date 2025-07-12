import { CardContent } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery Skeleton */}
          <Skeleton className="aspect-square w-full rounded-lg" />

          {/* Item Details Skeleton */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-10 w-3/4 mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[80%]" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24 mt-1" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24 mt-1" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24 mt-1" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24 mt-1" />
                  </div>
                  <div className="col-span-2 flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Uploader Info Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-32" />
              </CardHeader>
              <CardContent className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-40 mb-1" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-24 mt-2" />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons Skeleton */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

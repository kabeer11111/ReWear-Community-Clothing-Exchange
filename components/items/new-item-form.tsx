"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, PlusCircle, ImageIcon, X } from "lucide-react"
import type { ItemCondition } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { v4 as uuidv4 } from "uuid" // For unique file names

export function NewItemForm() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    type: "",
    size: "",
    condition: "" as ItemCondition,
    tags: "",
    images: [] as string[], // Stores public URLs of uploaded images
    points_value: 10,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const { data: user, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error("User not authenticated for image upload.")
      }

      const fileExtension = file.name.split(".").pop()
      const fileName = `${uuidv4()}.${fileExtension}`
      const filePath = `${user.user.id}/${fileName}` // Store images in user-specific folders

      const { data, error } = await supabase.storage
        .from("item-images") // Your bucket name
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (error) {
        throw error
      }

      const { data: publicUrlData } = supabase.storage.from("item-images").getPublicUrl(filePath)

      if (!publicUrlData.publicUrl) {
        throw new Error("Failed to get public URL for image.")
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, publicUrlData.publicUrl],
      }))

      toast({
        title: "Image Uploaded",
        description: "Image uploaded successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error Uploading Image",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)

      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to list item")
      }

      toast({
        title: "Item Listed!",
        description:
          "Your item has been submitted for approval. It will be visible to others once approved by an admin.",
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Item Details</CardTitle>
        <CardDescription>Provide information about the clothing item you want to list.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Blue Denim Jacket"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your item in detail (e.g., material, unique features, why you're swapping it)."
              value={formData.description}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                onValueChange={(value) => handleSelectChange("category", value)}
                value={formData.category}
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tops">Tops</SelectItem>
                  <SelectItem value="bottoms">Bottoms</SelectItem>
                  <SelectItem value="dresses">Dresses</SelectItem>
                  <SelectItem value="outerwear">Outerwear</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="footwear">Footwear</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type (e.g., Shirt, Jeans)</Label>
              <Input
                id="type"
                placeholder="e.g., T-Shirt, Jeans, Skirt"
                value={formData.type}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                placeholder="e.g., M, L, 32, One Size"
                value={formData.size}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                onValueChange={(value) => handleSelectChange("condition", value as ItemCondition)}
                value={formData.condition}
                required
              >
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New (with tags)</SelectItem>
                  <SelectItem value="like_new">Like New (no flaws)</SelectItem>
                  <SelectItem value="good">Good (minor wear)</SelectItem>
                  <SelectItem value="fair">Fair (visible flaws)</SelectItem>
                  <SelectItem value="poor">Poor (significant wear)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g., vintage, casual, summer, cotton"
              value={formData.tags}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="images">Images</Label>
            <div className="flex items-center gap-2">
              <Input id="images" type="file" accept="image/*" onChange={handleImageUpload} className="flex-grow" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => document.getElementById("images")?.click()}
                disabled={isLoading}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.images.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img || "/placeholder.svg"}
                    alt={`Item image ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {formData.images.length === 0 && (
              <p className="text-sm text-muted-foreground">Upload at least one image for your item.</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="points_value">Points Value</Label>
            <Input
              id="points_value"
              type="number"
              placeholder="e.g., 10"
              value={formData.points_value}
              onChange={handleChange}
              min="1"
              required
            />
            <p className="text-sm text-muted-foreground">
              This is the number of points a user will earn when this item is approved.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || formData.images.length === 0}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            List Item
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

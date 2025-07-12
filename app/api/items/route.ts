import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Item } from "@/lib/types"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limitParam = Number(searchParams.get("limit") ?? "0")
  try {
    const supabase = await createClient()
    const { data: items, error } = await supabase
      .from("items")
      .select(
        `
        *,
        user:users(full_name, avatar_url)
      `,
      )
      .eq("status", "approved")
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .limit(limitParam > 0 ? limitParam : undefined)

    if (error) {
      console.error("Error fetching items:", error)
      return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
    }

    return NextResponse.json(items)
  } catch (error) {
    console.error("Unexpected error in GET /api/items:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const itemData: Omit<Item, "id" | "user_id" | "status" | "created_at" | "updated_at" | "is_available"> =
      await request.json()

    const { data: newItem, error } = await supabase
      .from("items")
      .insert({
        ...itemData,
        user_id: user.id,
        status: "pending", // New items are pending by default
        is_available: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating item:", error)
      return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
    }

    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    console.error("Unexpected error in POST /api/items:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

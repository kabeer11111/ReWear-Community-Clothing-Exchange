export type ItemCondition = "new" | "like_new" | "good" | "fair" | "poor"
export type ItemStatus = "pending" | "approved" | "rejected" | "swapped"
export type SwapStatus = "pending" | "accepted" | "rejected" | "completed"
export type UserRole = "user" | "admin"

export interface User {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  points: number
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  user_id: string
  title: string
  description?: string
  category: string
  type: string
  size: string
  condition: ItemCondition
  tags: string[]
  images: string[]
  points_value: number
  status: ItemStatus
  is_available: boolean
  created_at: string
  updated_at: string
  user?: User // Populated via join in Supabase query
}

export interface Swap {
  id: string
  requester_id: string
  owner_id: string
  item_id: string
  offered_item_id?: string | null
  points_offered: number
  status: SwapStatus
  message?: string | null
  created_at: string
  updated_at: string
  item?: Item
  offered_item?: Item
  requester?: User
  owner?: User
}

export interface PointsTransaction {
  id: string
  user_id: string
  amount: number
  type: string
  description?: string | null
  related_swap_id?: string | null
  created_at: string
}

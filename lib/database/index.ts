import { db } from "@/lib/firebase/config"
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  runTransaction,
} from "firebase/firestore"
import type { Item, User, Swap, Transaction } from "@/lib/types"

// Helper to convert Firestore DocumentData to our types
const docToUser = (doc: any): User => ({
  id: doc.id,
  email: doc.data().email,
  full_name: doc.data().full_name || null,
  avatar_url: doc.data().avatar_url || null,
  points: doc.data().points || 0,
  role: doc.data().role || "user",
  created_at: doc.data().created_at,
  updated_at: doc.data().updated_at,
})

const docToItem = (doc: any): Item => ({
  id: doc.id,
  user_id: doc.data().user_id,
  title: doc.data().title,
  description: doc.data().description,
  category: doc.data().category,
  size: doc.data().size,
  condition: doc.data().condition,
  images: doc.data().images || [],
  points_value: doc.data().points_value || 0,
  status: doc.data().status || "pending",
  created_at: doc.data().created_at,
  updated_at: doc.data().updated_at,
})

const docToSwap = (doc: any): Swap => ({
  id: doc.id,
  requester_id: doc.data().requester_id,
  offerer_id: doc.data().offerer_id,
  requested_item_id: doc.data().requested_item_id,
  offered_item_id: doc.data().offered_item_id,
  status: doc.data().status || "pending",
  created_at: doc.data().created_at,
  updated_at: doc.data().updated_at,
})

const docToTransaction = (doc: any): Transaction => ({
  id: doc.id,
  user_id: doc.data().user_id,
  type: doc.data().type,
  amount: doc.data().amount,
  description: doc.data().description,
  created_at: doc.data().created_at,
})

// --- User Operations ---
export async function getUserById(id: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, "users", id))
  return userDoc.exists() ? docToUser(userDoc) : null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const q = query(collection(db, "users"), where("email", "==", email))
  const querySnapshot = await getDocs(q)
  if (!querySnapshot.empty) {
    return docToUser(querySnapshot.docs[0])
  }
  return null
}

export async function createUser(userData: Omit<User, "id" | "created_at" | "updated_at">): Promise<User> {
  const now = Timestamp.now()
  const newUserRef = doc(collection(db, "users"), userData.id) // Use provided ID from Firebase Auth
  await updateDoc(newUserRef, {
    ...userData,
    points: userData.points || 100, // Default points for new users
    role: userData.role || "user",
    created_at: now,
    updated_at: now,
  })
  const newUserDoc = await getDoc(newUserRef)
  return docToUser(newUserDoc)
}

export async function updateUser(id: string, updates: Partial<Omit<User, "id" | "created_at">>): Promise<User | null> {
  const userRef = doc(db, "users", id)
  await updateDoc(userRef, { ...updates, updated_at: Timestamp.now() })
  return getUserById(id)
}

export async function deleteUser(id: string): Promise<void> {
  await deleteDoc(doc(db, "users", id))
  // Optionally delete associated items, swaps, transactions
  const itemsQuery = query(collection(db, "items"), where("user_id", "==", id))
  const itemsSnapshot = await getDocs(itemsQuery)
  itemsSnapshot.forEach(async (d) => await deleteDoc(d.ref))

  const swapsRequesterQuery = query(collection(db, "swaps"), where("requester_id", "==", id))
  const swapsRequesterSnapshot = await getDocs(swapsRequesterQuery)
  swapsRequesterSnapshot.forEach(async (d) => await deleteDoc(d.ref))

  const swapsOffererQuery = query(collection(db, "swaps"), where("offerer_id", "==", id))
  const swapsOffererSnapshot = await getDocs(swapsOffererQuery)
  swapsOffererSnapshot.forEach(async (d) => await deleteDoc(d.ref))

  const transactionsQuery = query(collection(db, "transactions"), where("user_id", "==", id))
  const transactionsSnapshot = await getDocs(transactionsQuery)
  transactionsSnapshot.forEach(async (d) => await deleteDoc(d.ref))
}

export async function getUsers(): Promise<User[]> {
  const querySnapshot = await getDocs(collection(db, "users"))
  return querySnapshot.docs.map(docToUser)
}

// --- Item Operations ---
export async function getItemById(id: string): Promise<Item | null> {
  const itemDoc = await getDoc(doc(db, "items", id))
  return itemDoc.exists() ? docToItem(itemDoc) : null
}

export async function getItems(): Promise<Item[]> {
  const querySnapshot = await getDocs(collection(db, "items"))
  return querySnapshot.docs.map(docToItem)
}

export async function getApprovedItems(): Promise<Item[]> {
  const q = query(collection(db, "items"), where("status", "==", "approved"))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(docToItem)
}

export async function getPendingItems(): Promise<Item[]> {
  const q = query(collection(db, "items"), where("status", "==", "pending"))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(docToItem)
}

export async function getItemsByUserId(userId: string): Promise<Item[]> {
  const q = query(collection(db, "items"), where("user_id", "==", userId))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(docToItem)
}

export async function createItem(itemData: Omit<Item, "id" | "created_at" | "updated_at" | "status">): Promise<Item> {
  const now = Timestamp.now()
  const newItemRef = await addDoc(collection(db, "items"), {
    ...itemData,
    status: "pending", // New items are pending by default
    created_at: now,
    updated_at: now,
  })
  const newItemDoc = await getDoc(newItemRef)
  return docToItem(newItemDoc)
}

export async function updateItem(id: string, updates: Partial<Omit<Item, "id" | "created_at">>): Promise<Item | null> {
  const itemRef = doc(db, "items", id)
  await updateDoc(itemRef, { ...updates, updated_at: Timestamp.now() })
  return getItemById(id)
}

export async function deleteItem(id: string): Promise<void> {
  await deleteDoc(doc(db, "items", id))
}

// --- Swap Operations ---
export async function getSwapById(id: string): Promise<Swap | null> {
  const swapDoc = await getDoc(doc(db, "swaps", id))
  return swapDoc.exists() ? docToSwap(swapDoc) : null
}

export async function getSwapsByUserId(userId: string): Promise<Swap[]> {
  const q1 = query(collection(db, "swaps"), where("requester_id", "==", userId))
  const q2 = query(collection(db, "swaps"), where("offerer_id", "==", userId))

  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)])

  const swaps = [...snapshot1.docs.map(docToSwap), ...snapshot2.docs.map(docToSwap)]
  return Array.from(new Map(swaps.map((swap) => [swap.id, swap])).values()) // Remove duplicates
}

export async function createSwap(swapData: Omit<Swap, "id" | "created_at" | "updated_at" | "status">): Promise<Swap> {
  const now = Timestamp.now()
  const newSwapRef = await addDoc(collection(db, "swaps"), {
    ...swapData,
    status: "pending",
    created_at: now,
    updated_at: now,
  })
  const newSwapDoc = await getDoc(newSwapRef)
  return docToSwap(newSwapDoc)
}

export async function updateSwap(id: string, updates: Partial<Omit<Swap, "id" | "created_at">>): Promise<Swap | null> {
  const swapRef = doc(db, "swaps", id)
  await updateDoc(swapRef, { ...updates, updated_at: Timestamp.now() })
  return getSwapById(id)
}

// --- Transaction Operations ---
export async function addTransaction(transactionData: Omit<Transaction, "id" | "created_at">): Promise<Transaction> {
  const now = Timestamp.now()
  const newTransactionRef = await addDoc(collection(db, "transactions"), {
    ...transactionData,
    created_at: now,
  })
  const newTransactionDoc = await getDoc(newTransactionRef)
  return docToTransaction(newTransactionDoc)
}

export async function getTransactionsByUserId(userId: string): Promise<Transaction[]> {
  const q = query(collection(db, "transactions"), where("user_id", "==", userId))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(docToTransaction)
}

// --- Points System ---
export async function updateUserPoints(
  userId: string,
  amount: number,
  type: "earned" | "spent" | "admin_adjustment",
  description: string,
): Promise<User | null> {
  const userRef = doc(db, "users", userId)

  return runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef)
    if (!userDoc.exists()) {
      throw new Error("User not found!")
    }

    const currentPoints = userDoc.data().points || 0
    const newPoints = currentPoints + amount

    if (newPoints < 0 && type === "spent") {
      throw new Error("Insufficient points")
    }

    transaction.update(userRef, { points: newPoints, updated_at: Timestamp.now() })
    transaction.set(collection(db, "transactions").doc(), {
      user_id: userId,
      type,
      amount,
      description,
      created_at: Timestamp.now(),
    })

    const updatedUserDoc = await transaction.get(userRef)
    return docToUser(updatedUserDoc)
  })
}

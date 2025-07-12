import { auth, db } from "@/lib/firebase/config"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore"
import type { User } from "@/lib/types"

// This function is primarily for client-side use to get the current user.
// For server-side (SSR/Server Components), you'd typically verify a Firebase ID token
// passed via a cookie or header. This simplified version relies on client-side auth state.
export async function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe() // Unsubscribe immediately after getting the state
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          resolve({
            id: userDoc.id,
            email: userDoc.data().email,
            full_name: userDoc.data().full_name || null,
            avatar_url: userDoc.data().avatar_url || null,
            points: userDoc.data().points || 0,
            role: userDoc.data().role || "user",
            created_at: userDoc.data().created_at,
            updated_at: userDoc.data().updated_at,
          })
        } else {
          // If user exists in Firebase Auth but not in Firestore (e.g., new Google sign-up)
          // Create a new user document in Firestore
          const newUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            full_name: firebaseUser.displayName || null,
            avatar_url: firebaseUser.photoURL || null,
            points: 100, // Default points
            role: "user", // Default role
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          }
          await setDoc(userDocRef, newUser)
          resolve(newUser)
        }
      } else {
        resolve(null)
      }
    })
  })
}

// Server-side authentication check for protected routes
// In a full production app, this would involve Firebase Admin SDK to verify ID tokens
// passed from the client in a secure HTTP-only cookie.
// For this example, we'll rely on client-side redirects for most protection,
// and a basic check for the presence of a user object.
export async function requireAuth(): Promise<User> {
  // This is a placeholder. In a real SSR app with Firebase, you'd:
  // 1. Get the Firebase ID token from a secure HTTP-only cookie.
  // 2. Use Firebase Admin SDK to verify the ID token on the server.
  // 3. Fetch user data from Firestore using the UID from the verified token.
  // Since we don't have Admin SDK in this browser-based environment,
  // we'll rely on client-side redirects for now.
  // For server components, you'd typically pass the user data as props from a layout/page.
  const user = await getCurrentUser() // This will resolve client-side, but for server components, it's tricky.
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  if (user.role !== "admin") {
    throw new Error("Admin access required")
  }
  return user
}

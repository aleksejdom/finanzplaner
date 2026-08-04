import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

// Für Server Components/Actions, die zwingend einen eingeloggten Nutzer
// brauchen – entspricht dem bisherigen supabase.auth.getUser()-Guard.
export async function requireUser() {
  const session = await getSession()
  if (!session) redirect("/login")
  return session.user
}

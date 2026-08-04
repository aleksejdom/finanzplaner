import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { categories } from "@/db/schema"
import { DEFAULT_CATEGORIES } from "@/lib/default-categories"

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    // Wie zuvor bei der Supabase-Edge-Function: Konten werden ohne
    // Bestätigungs-E-Mail direkt nutzbar angelegt und automatisch eingeloggt.
    requireEmailVerification: false,
    autoSignIn: true,
    minPasswordLength: 6,
  },
  databaseHooks: {
    user: {
      create: {
        async after(user) {
          await db.insert(categories).values(
            DEFAULT_CATEGORIES.map((c) => ({
              userId: user.id,
              name: c.name,
              type: c.type,
              color: c.color,
            }))
          )
        },
      },
    },
  },
  plugins: [nextCookies()],
})

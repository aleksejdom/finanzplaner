import { defineConfig } from "drizzle-kit"

// drizzle-kit lädt (anders als Next.js) .env.local nicht automatisch.
try {
  process.loadEnvFile(".env.local")
} catch {
  // .env.local fehlt (z. B. in CI, wo DATABASE_URL bereits gesetzt ist)
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL ist nicht gesetzt (.env.local prüfen)")
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})

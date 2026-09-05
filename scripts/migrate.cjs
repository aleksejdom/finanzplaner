// Wendet beim Container-Start automatisch alle noch fehlenden Migrationen
// aus drizzle/ an. Nutzt bewusst nur drizzle-orm + pg (Produktions-
// Dependencies, die im Next-Standalone-Build ohnehin enthalten sind) statt
// drizzle-kit, damit kein zusätzliches Kopieren von devDependencies ins
// Runtime-Image nötig ist. Idempotent: bereits angewendete Migrationen
// werden anhand von drizzle."__drizzle_migrations" übersprungen.
const { Pool } = require("pg")
const { drizzle } = require("drizzle-orm/node-postgres")
const { migrate } = require("drizzle-orm/node-postgres/migrator")

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL ist nicht gesetzt")
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)

  try {
    await migrate(db, { migrationsFolder: "./drizzle" })
  } finally {
    await pool.end()
  }
}

main()
  .then(() => {
    console.log("[migrate] Datenbankschema ist aktuell.")
  })
  .catch((error) => {
    console.error("[migrate] Migration fehlgeschlagen:", error)
    process.exit(1)
  })

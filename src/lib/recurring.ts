import { and, eq, gte, lt } from "drizzle-orm"
import { db } from "@/db"
import { recurringExclusions, transactions } from "@/db/schema"

function toDateOnly(d: Date) {
  return d.toISOString().slice(0, 10)
}

// Ersetzt die bisherige Supabase-RPC `process_recurring_transactions`:
// Für jede als wiederkehrend markierte Vorlage wird geprüft, ob für den
// laufenden Monat bereits eine daraus erzeugte Buchung existiert – falls
// nicht, wird sie neu angelegt (Tag im Monat wird ggf. auf den letzten
// Tag des Monats begrenzt, z. B. 31. Januar → 28./29. Februar).
export async function processRecurringTransactions(userId: string) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const firstOfMonth = new Date(year, month - 1, 1)
  const firstOfNextMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month, 0).getDate()

  const monthKey = `${year}-${String(month).padStart(2, "0")}`

  const templates = await db
    .select()
    .from(transactions)
    .where(
      and(eq(transactions.userId, userId), eq(transactions.isRecurring, true))
    )

  for (const template of templates) {
    const excluded = await db
      .select({ id: recurringExclusions.id })
      .from(recurringExclusions)
      .where(
        and(
          eq(recurringExclusions.templateId, template.id),
          eq(recurringExclusions.month, monthKey)
        )
      )
      .limit(1)

    if (excluded.length > 0) continue

    const existing = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.recurringSourceId, template.id),
          gte(transactions.date, toDateOnly(firstOfMonth)),
          lt(transactions.date, toDateOnly(firstOfNextMonth))
        )
      )
      .limit(1)

    if (existing.length > 0) continue

    // Vorlage selbst liegt evtl. schon im laufenden Monat -> nicht doppelt anlegen
    if (String(template.date).slice(0, 7) === `${year}-${String(month).padStart(2, "0")}`) {
      continue
    }

    const originalDay = Number(String(template.date).slice(8, 10))
    const day = Math.min(originalDay, daysInMonth)
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`

    await db.insert(transactions).values({
      userId,
      categoryId: template.categoryId,
      type: template.type,
      amount: template.amount,
      description: template.description,
      date,
      isRecurring: false,
      recurringSourceId: template.id,
    })
  }
}

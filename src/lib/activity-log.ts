import { db } from "@/db"
import { activityLog } from "@/db/schema"
import type { ActivityLogEntry } from "@/lib/types"

// Ersetzt den bisherigen Supabase-Trigger `log_transaction_change`: Da es
// keine Datenbank-Trigger mehr gibt, wird nach jeder Mutation an
// Transaktionen/Sparbuchungen manuell ein Protokolleintrag geschrieben.
export async function logActivity(
  userId: string,
  action: ActivityLogEntry["action"],
  entity: string,
  details: ActivityLogEntry["details"]
) {
  await db.insert(activityLog).values({
    userId,
    action,
    entity,
    details,
  })
}

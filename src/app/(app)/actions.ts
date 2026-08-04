"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { and, eq } from "drizzle-orm"
import { getTranslations } from "next-intl/server"
import { db } from "@/db"
import {
  categories,
  savingsAccounts,
  savingsEntries,
  savingsGoals,
  transactions,
} from "@/db/schema"
import { logActivity } from "@/lib/activity-log"
import { getSession } from "@/lib/session"
import { auth } from "@/lib/auth"

type ActionResult = { error?: string }

async function getUserOrThrow() {
  const session = await getSession()
  if (!session) redirect("/login")
  return { userId: session.user.id }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  )
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() })
  redirect("/login")
}

// ---------- Transaktionen ----------

export async function createTransaction(formData: FormData): Promise<ActionResult> {
  const { userId } = await getUserOrThrow()

  const amount = Number(formData.get("amount"))
  const type = formData.get("type") as "income" | "expense"
  const description = (formData.get("description") as string) ?? ""
  const date = formData.get("date") as string
  const categoryId = (formData.get("category_id") as string) || null

  try {
    const [created] = await db
      .insert(transactions)
      .values({
        userId,
        type,
        amount,
        categoryId,
        description,
        date,
        isRecurring: formData.get("is_recurring") === "on",
      })
      .returning()

    await logActivity(userId, "created", "transaction", {
      id: created.id,
      type,
      amount,
      description,
      date,
    })
  } catch (error) {
    return { error: (error as Error).message }
  }

  revalidatePath("/", "layout")
  return {}
}

export async function updateTransaction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const { userId } = await getUserOrThrow()

  const amount = Number(formData.get("amount"))
  const type = formData.get("type") as "income" | "expense"
  const description = (formData.get("description") as string) ?? ""
  const date = formData.get("date") as string
  const categoryId = (formData.get("category_id") as string) || null

  try {
    const [previous] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))

    await db
      .update(transactions)
      .set({
        type,
        amount,
        categoryId,
        description,
        date,
        isRecurring: formData.get("is_recurring") === "on",
      })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))

    await logActivity(userId, "updated", "transaction", {
      id,
      type,
      amount,
      description,
      date,
      previous: previous
        ? {
            amount: previous.amount,
            description: previous.description,
            date: previous.date,
          }
        : undefined,
    })
  } catch (error) {
    return { error: (error as Error).message }
  }

  revalidatePath("/", "layout")
  return {}
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const { userId } = await getUserOrThrow()

  try {
    const [previous] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))

    await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))

    if (previous) {
      await logActivity(userId, "deleted", "transaction", {
        id,
        type: previous.type,
        amount: previous.amount,
        description: previous.description,
        date: previous.date,
      })
    }
  } catch (error) {
    return { error: (error as Error).message }
  }

  revalidatePath("/", "layout")
  return {}
}

// ---------- Kategorien ----------

export async function createCategory(formData: FormData): Promise<ActionResult> {
  const { userId } = await getUserOrThrow()

  try {
    await db.insert(categories).values({
      userId,
      name: (formData.get("name") as string).trim(),
      type: formData.get("type") as "income" | "expense",
      color: formData.get("color") as string,
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      const t = await getTranslations("actions")
      return { error: t("categoryExists") }
    }
    return { error: (error as Error).message }
  }

  revalidatePath("/", "layout")
  return {}
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const { userId } = await getUserOrThrow()

  try {
    await db
      .update(categories)
      .set({
        name: (formData.get("name") as string).trim(),
        color: formData.get("color") as string,
      })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
  } catch (error) {
    return { error: (error as Error).message }
  }

  revalidatePath("/", "layout")
  return {}
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const { userId } = await getUserOrThrow()
  try {
    await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
  } catch (error) {
    return { error: (error as Error).message }
  }
  revalidatePath("/", "layout")
  return {}
}

// ---------- Sparziele ----------

export async function createGoal(formData: FormData): Promise<ActionResult> {
  const { userId } = await getUserOrThrow()

  const currentAge = Number(formData.get("current_age"))
  const targetAge = Number(formData.get("target_age"))
  if (targetAge <= currentAge) {
    const t = await getTranslations("actions")
    return { error: t("targetAgeError") }
  }

  try {
    await db.insert(savingsGoals).values({
      userId,
      name: (formData.get("name") as string).trim(),
      currentAge,
      targetAge,
      targetAmount: Number(formData.get("target_amount")),
      initialAmount: Number(formData.get("initial_amount") || 0),
      etfEnabled: formData.get("etf_enabled") === "on",
      etfAnnualReturn: Number(formData.get("etf_annual_return") || 7),
    })
  } catch (error) {
    return { error: (error as Error).message }
  }

  revalidatePath("/", "layout")
  return {}
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  const { userId } = await getUserOrThrow()
  try {
    await db
      .delete(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)))
  } catch (error) {
    return { error: (error as Error).message }
  }
  revalidatePath("/", "layout")
  return {}
}

// ---------- Sparkonto ----------

export async function createSavingsAccount(
  formData: FormData
): Promise<ActionResult> {
  const { userId } = await getUserOrThrow()
  try {
    await db.insert(savingsAccounts).values({
      userId,
      name: (formData.get("name") as string).trim(),
      color: formData.get("color") as string,
    })
  } catch (error) {
    return { error: (error as Error).message }
  }
  revalidatePath("/", "layout")
  return {}
}

export async function updateSavingsAccount(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const { userId } = await getUserOrThrow()
  try {
    await db
      .update(savingsAccounts)
      .set({
        name: (formData.get("name") as string).trim(),
        color: formData.get("color") as string,
      })
      .where(and(eq(savingsAccounts.id, id), eq(savingsAccounts.userId, userId)))
  } catch (error) {
    return { error: (error as Error).message }
  }
  revalidatePath("/", "layout")
  return {}
}

export async function deleteSavingsAccount(id: string): Promise<ActionResult> {
  const { userId } = await getUserOrThrow()
  try {
    await db
      .delete(savingsAccounts)
      .where(and(eq(savingsAccounts.id, id), eq(savingsAccounts.userId, userId)))
  } catch (error) {
    return { error: (error as Error).message }
  }
  revalidatePath("/", "layout")
  return {}
}

export async function createSavingsEntry(
  formData: FormData
): Promise<ActionResult> {
  const { userId } = await getUserOrThrow()

  const direction = formData.get("direction") as "deposit" | "withdrawal"
  const amount = Number(formData.get("amount"))
  const description = (formData.get("description") as string) ?? ""
  const date = formData.get("date") as string

  try {
    const [created] = await db
      .insert(savingsEntries)
      .values({
        userId,
        accountId: (formData.get("account_id") as string) || null,
        direction,
        amount,
        description,
        date,
      })
      .returning()

    await logActivity(userId, "created", "savings", {
      id: created.id,
      direction,
      amount,
      description,
      date,
    })
  } catch (error) {
    return { error: (error as Error).message }
  }

  revalidatePath("/", "layout")
  return {}
}

export async function updateSavingsEntry(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const { userId } = await getUserOrThrow()

  const direction = formData.get("direction") as "deposit" | "withdrawal"
  const amount = Number(formData.get("amount"))
  const description = (formData.get("description") as string) ?? ""
  const date = formData.get("date") as string

  try {
    const [previous] = await db
      .select()
      .from(savingsEntries)
      .where(and(eq(savingsEntries.id, id), eq(savingsEntries.userId, userId)))

    await db
      .update(savingsEntries)
      .set({
        accountId: (formData.get("account_id") as string) || null,
        direction,
        amount,
        description,
        date,
      })
      .where(and(eq(savingsEntries.id, id), eq(savingsEntries.userId, userId)))

    await logActivity(userId, "updated", "savings", {
      id,
      direction,
      amount,
      description,
      date,
      previous: previous
        ? {
            amount: previous.amount,
            description: previous.description,
            date: previous.date,
          }
        : undefined,
    })
  } catch (error) {
    return { error: (error as Error).message }
  }

  revalidatePath("/", "layout")
  return {}
}

export async function deleteSavingsEntry(id: string): Promise<ActionResult> {
  const { userId } = await getUserOrThrow()

  try {
    const [previous] = await db
      .select()
      .from(savingsEntries)
      .where(and(eq(savingsEntries.id, id), eq(savingsEntries.userId, userId)))

    await db
      .delete(savingsEntries)
      .where(and(eq(savingsEntries.id, id), eq(savingsEntries.userId, userId)))

    if (previous) {
      await logActivity(userId, "deleted", "savings", {
        id,
        direction: previous.direction,
        amount: previous.amount,
        description: previous.description,
        date: previous.date,
      })
    }
  } catch (error) {
    return { error: (error as Error).message }
  }

  revalidatePath("/", "layout")
  return {}
}

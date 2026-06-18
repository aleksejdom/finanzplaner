"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"

async function getUserOrThrow() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return { supabase, user }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

// ---------- Transaktionen ----------

export async function createTransaction(formData: FormData) {
  const { supabase, user } = await getUserOrThrow()

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type: formData.get("type") as string,
    amount: Number(formData.get("amount")),
    category_id: (formData.get("category_id") as string) || null,
    description: (formData.get("description") as string) ?? "",
    date: formData.get("date") as string,
    is_recurring: formData.get("is_recurring") === "on",
  })

  if (error) return { error: error.message }
  revalidatePath("/", "layout")
  return {}
}

export async function updateTransaction(id: string, formData: FormData) {
  const { supabase } = await getUserOrThrow()

  const { error } = await supabase
    .from("transactions")
    .update({
      type: formData.get("type") as string,
      amount: Number(formData.get("amount")),
      category_id: (formData.get("category_id") as string) || null,
      description: (formData.get("description") as string) ?? "",
      date: formData.get("date") as string,
      is_recurring: formData.get("is_recurring") === "on",
    })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/", "layout")
  return {}
}

export async function deleteTransaction(id: string) {
  const { supabase } = await getUserOrThrow()
  const { error } = await supabase.from("transactions").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/", "layout")
  return {}
}

// ---------- Kategorien ----------

export async function createCategory(formData: FormData) {
  const { supabase, user } = await getUserOrThrow()

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: (formData.get("name") as string).trim(),
    type: formData.get("type") as string,
    color: formData.get("color") as string,
  })

  if (error) {
    const t = await getTranslations("actions")
    return {
      error: error.code === "23505" ? t("categoryExists") : error.message,
    }
  }
  revalidatePath("/", "layout")
  return {}
}

export async function updateCategory(id: string, formData: FormData) {
  const { supabase } = await getUserOrThrow()

  const { error } = await supabase
    .from("categories")
    .update({
      name: (formData.get("name") as string).trim(),
      color: formData.get("color") as string,
    })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/", "layout")
  return {}
}

export async function deleteCategory(id: string) {
  const { supabase } = await getUserOrThrow()
  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/", "layout")
  return {}
}

// ---------- Sparziele ----------

export async function createGoal(formData: FormData) {
  const { supabase, user } = await getUserOrThrow()

  const currentAge = Number(formData.get("current_age"))
  const targetAge = Number(formData.get("target_age"))
  if (targetAge <= currentAge) {
    const t = await getTranslations("actions")
    return { error: t("targetAgeError") }
  }

  const { error } = await supabase.from("savings_goals").insert({
    user_id: user.id,
    name: (formData.get("name") as string).trim(),
    current_age: currentAge,
    target_age: targetAge,
    target_amount: Number(formData.get("target_amount")),
    initial_amount: Number(formData.get("initial_amount") || 0),
    etf_enabled: formData.get("etf_enabled") === "on",
    etf_annual_return: Number(formData.get("etf_annual_return") || 7),
  })

  if (error) return { error: error.message }
  revalidatePath("/", "layout")
  return {}
}

export async function deleteGoal(id: string) {
  const { supabase } = await getUserOrThrow()
  const { error } = await supabase.from("savings_goals").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/", "layout")
  return {}
}

// ---------- Sparkonto ----------

export async function createSavingsAccount(formData: FormData) {
  const { supabase, user } = await getUserOrThrow()
  const { error } = await supabase.from("savings_accounts").insert({
    user_id: user.id,
    name: (formData.get("name") as string).trim(),
    color: formData.get("color") as string,
  })
  if (error) return { error: error.message }
  revalidatePath("/", "layout")
  return {}
}

export async function updateSavingsAccount(id: string, formData: FormData) {
  const { supabase } = await getUserOrThrow()
  const { error } = await supabase
    .from("savings_accounts")
    .update({
      name: (formData.get("name") as string).trim(),
      color: formData.get("color") as string,
    })
    .eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/", "layout")
  return {}
}

export async function deleteSavingsAccount(id: string) {
  const { supabase } = await getUserOrThrow()
  const { error } = await supabase.from("savings_accounts").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/", "layout")
  return {}
}

export async function createSavingsEntry(formData: FormData) {
  const { supabase, user } = await getUserOrThrow()

  const { error } = await supabase.from("savings_entries").insert({
    user_id: user.id,
    account_id: (formData.get("account_id") as string) || null,
    direction: formData.get("direction") as string,
    amount: Number(formData.get("amount")),
    description: (formData.get("description") as string) ?? "",
    date: formData.get("date") as string,
  })

  if (error) return { error: error.message }
  revalidatePath("/", "layout")
  return {}
}

export async function updateSavingsEntry(id: string, formData: FormData) {
  const { supabase } = await getUserOrThrow()
  const { error } = await supabase
    .from("savings_entries")
    .update({
      account_id: (formData.get("account_id") as string) || null,
      direction: formData.get("direction") as string,
      amount: Number(formData.get("amount")),
      description: (formData.get("description") as string) ?? "",
      date: formData.get("date") as string,
    })
    .eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/", "layout")
  return {}
}

export async function deleteSavingsEntry(id: string) {
  const { supabase } = await getUserOrThrow()
  const { error } = await supabase.from("savings_entries").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/", "layout")
  return {}
}

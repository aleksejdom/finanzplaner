"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { SavingsAccount } from "@/lib/types"

export function AccountTabs({
  accounts,
  selectedId,
}: {
  accounts: SavingsAccount[]
  selectedId: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("savings")

  function navigate(accountId: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (accountId) params.set("konto", accountId)
    else params.delete("konto")
    router.push(`/savings?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => navigate(null)}
        className={cn(
          "flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors",
          !selectedId
            ? "bg-primary text-primary-foreground"
            : "border bg-background text-foreground hover:bg-muted"
        )}
      >
        {t("allAccounts")}
      </button>
      {accounts.map((acc) => (
        <button
          key={acc.id}
          type="button"
          onClick={() => navigate(acc.id)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors",
            selectedId === acc.id
              ? "bg-primary text-primary-foreground"
              : "border bg-background text-foreground hover:bg-muted"
          )}
        >
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: acc.color }}
          />
          {acc.name}
        </button>
      ))}
    </div>
  )
}

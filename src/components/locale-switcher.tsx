"use client"

import { useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { setLocale } from "@/i18n/actions"
import { Button } from "@/components/ui/button"

export function LocaleSwitcher() {
  const locale = useLocale()
  const t = useTranslations("common")
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const next = locale === "de" ? "ru" : "de"

  function handleClick() {
    startTransition(async () => {
      await setLocale(next)
      router.refresh()
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={t("switchLanguage")}
      onClick={handleClick}
      disabled={pending}
      className="px-2 font-semibold text-muted-foreground"
    >
      {locale === "de" ? "RU" : "DE"}
    </Button>
  )
}

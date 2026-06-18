"use client"

import { LogOut } from "lucide-react"
import { useTranslations } from "next-intl"
import { signOut } from "@/app/(app)/actions"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const t = useTranslations("nav")

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground"
      onClick={() => signOut()}
      aria-label={t("logout")}
    >
      <LogOut className="size-4" />
      <span className="hidden lg:inline">{t("logout")}</span>
    </Button>
  )
}

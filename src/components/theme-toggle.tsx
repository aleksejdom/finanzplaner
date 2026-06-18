"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useTranslations("common")
  const [mounted, setMounted] = useState(false)

  // Erst nach dem Mount rendern, sonst Hydration-Mismatch (Theme ist nur im Browser bekannt)
  useEffect(() => setMounted(true), [])

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t("toggleTheme")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="text-muted-foreground"
    >
      {mounted && resolvedTheme === "dark" ? <Sun /> : <Moon />}
    </Button>
  )
}

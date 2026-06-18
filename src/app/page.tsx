"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase/client"
import { LogoMark } from "@/components/logo"

// Client-Komponente: Der Browser-Client tauscht hier auch den ?code= aus
// E-Mail-Bestätigungslinks automatisch gegen eine Session (PKCE).
export default function Home() {
  const router = useRouter()
  const t = useTranslations("common")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      router.replace(session ? "/dashboard" : "/login")
    })
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-muted-foreground">
      <LogoMark className="size-12 animate-pulse rounded-xl shadow-[0_0_32px] shadow-primary/40" />
      <p>{t("loading")}</p>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em]">
        by Domowets
      </p>
    </div>
  )
}

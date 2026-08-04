"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { signUp } from "@/lib/auth-client"
import { LogoMark } from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations("auth")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const email = (formData.get("email") as string).trim()
    const password = formData.get("password") as string
    const name = formData.get("name") as string

    if (password.length < 6) {
      setLoading(false)
      toast.error(t("errorPasswordLength"))
      return
    }

    // requireEmailVerification/autoSignIn sind serverseitig aktiv – das Konto
    // wird direkt nutzbar angelegt und die Session sofort gesetzt.
    const { error } = await signUp.email({ email, password, name })

    if (error) {
      setLoading(false)
      toast.error(
        error.code === "USER_ALREADY_EXISTS"
          ? t("errorEmailExists")
          : error.code === "INVALID_EMAIL"
            ? t("errorInvalidEmail")
            : error.code === "PASSWORD_TOO_SHORT"
              ? t("errorPasswordLength")
              : t("errorRegistration", { reason: error.message ?? "unknown" })
      )
      return
    }

    toast.success(t("welcome"))
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <LogoMark className="mx-auto mb-2 size-14 rounded-xl shadow-[0_0_32px] shadow-primary/40" />
          <CardTitle className="text-2xl">{t("registerTitle")}</CardTitle>
          <CardDescription>{t("registerSubtitle")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input
                id="name"
                name="name"
                placeholder={t("namePlaceholder")}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                required
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder={t("passwordPlaceholder")}
              />
            </div>
          </CardContent>
          <CardFooter className="mt-6 flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("registering") : t("register")}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t("haveAccount")}{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                {t("login")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        FinanzPilot by Domowets
      </p>
    </div>
  )
}

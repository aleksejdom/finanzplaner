"use server"

import { getTranslations } from "next-intl/server"

// Registrierung über die signup-Edge-Function: Der Nutzer wird per Admin-API
// direkt bestätigt angelegt – ohne Bestätigungs-E-Mail und damit ohne das
// E-Mail-Rate-Limit des eingebauten Supabase-Mailservice.
export async function registerUser(input: {
  email: string
  password: string
  displayName: string
}): Promise<{ error?: string }> {
  const t = await getTranslations("auth")

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/signup`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_ANON_LEGACY_KEY}`,
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        display_name: input.displayName,
      }),
    }
  )

  if (res.ok) return {}

  const body = await res.json().catch(() => ({ error: "unknown" }))
  switch (body.error) {
    case "email_exists":
      return { error: t("errorEmailExists") }
    case "invalid_email":
      return { error: t("errorInvalidEmail") }
    case "weak_password":
      return { error: t("errorPasswordLength") }
    default:
      return {
        error: t("errorRegistration", {
          reason: body.error ?? res.statusText,
        }),
      }
  }
}

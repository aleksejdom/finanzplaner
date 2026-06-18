import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

export const LOCALES = ["de", "ru"] as const
export type Locale = (typeof LOCALES)[number]

export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = store.get("locale")?.value
  const locale: Locale = cookieLocale === "ru" ? "ru" : "de"

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const INTL_LOCALES: Record<string, string> = {
  de: "de-DE",
  ru: "ru-RU",
}

function intlLocale(locale: string) {
  return INTL_LOCALES[locale] ?? "de-DE"
}

export function formatCurrency(amount: number, locale = "de", currency = "EUR") {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDate(date: string | Date, locale = "de") {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

export function formatMonth(year: number, month: number, locale = "de") {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1))
}

export function formatTimestamp(date: string | Date, locale = "de") {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date))
}

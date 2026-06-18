"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { formatMonth } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SavingsPeriodPicker({
  mode,
  selectedMonth,
  selectedYear,
  availableMonths,
  availableYears,
}: {
  mode: "month" | "year"
  selectedMonth: string
  selectedYear: number
  availableMonths: string[]
  availableYears: number[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const t = useTranslations("savings")

  function buildUrl(overrides: Record<string, string | null>) {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) p.delete(k)
      else p.set(k, v)
    }
    return `/savings?${p.toString()}`
  }

  function switchMode(newMode: string) {
    if (newMode === "month") {
      router.push(buildUrl({ monat: selectedMonth, jahr: null }))
    } else {
      router.push(buildUrl({ jahr: String(selectedYear), monat: null }))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tabs value={mode} onValueChange={switchMode}>
        <TabsList>
          <TabsTrigger value="month">{t("monthView")}</TabsTrigger>
          <TabsTrigger value="year">{t("yearView")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === "month" ? (
        <Select
          value={selectedMonth}
          onValueChange={(v) => router.push(buildUrl({ monat: v, jahr: null }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((m) => {
              const [y, mo] = m.split("-").map(Number)
              return (
                <SelectItem key={m} value={m}>
                  {formatMonth(y, mo, locale)}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      ) : (
        <Select
          value={String(selectedYear)}
          onValueChange={(v) => router.push(buildUrl({ jahr: v, monat: null }))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

"use client"

import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { formatMonth } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function MonthPicker({
  months,
  selected,
}: {
  months: string[] // "YYYY-MM"
  selected: string
}) {
  const router = useRouter()
  const locale = useLocale()

  return (
    <Select
      value={selected}
      onValueChange={(v) => router.push(`/transactions?monat=${v}`)}
    >
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {months.map((m) => {
          const [y, mo] = m.split("-").map(Number)
          return (
            <SelectItem key={m} value={m}>
              {formatMonth(y, mo, locale)}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

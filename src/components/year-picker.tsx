"use client"

import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function YearPicker({
  years,
  selected,
}: {
  years: number[]
  selected: number
}) {
  const router = useRouter()

  return (
    <Select
      value={String(selected)}
      onValueChange={(v) => router.push(`/archive?jahr=${v}`)}
    >
      <SelectTrigger className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)}>
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

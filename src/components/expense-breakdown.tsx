"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

export interface ExpenseGroupItem {
  id: string
  label: string
  sub: string
  amount: string
}

export interface ExpenseGroup {
  key: string
  name: string
  color: string
  sum: string
  percent: number
  items: ExpenseGroupItem[]
}

export function ExpenseBreakdown({ groups }: { groups: ExpenseGroup[] }) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="grid gap-2">
      {groups.map((g) => {
        const expanded = open === g.key
        return (
          <div key={g.key} className="grid gap-1.5">
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : g.key)}
              aria-expanded={expanded}
              className="grid w-full gap-1.5 rounded-lg p-1.5 text-left transition-colors hover:bg-muted/60"
            >
              <span className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: g.color }}
                  />
                  {g.name}
                  <ChevronDown
                    className={cn(
                      "size-3.5 text-muted-foreground transition-transform",
                      expanded && "rotate-180"
                    )}
                  />
                </span>
                <span className="tabular-nums font-medium">{g.sum}</span>
              </span>
              <Progress value={g.percent} />
            </button>
            {expanded && (
              <ul className="mb-1 ml-2 grid gap-1 border-l pl-4">
                {g.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-baseline justify-between gap-3 py-0.5 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.sub}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {item.amount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"
import { eq } from "drizzle-orm"
import { ArrowRight, ChevronRight } from "lucide-react"
import { db } from "@/db"
import { transactions } from "@/db/schema"
import { requireUser } from "@/lib/session"
import { formatCurrency, formatMonth } from "@/lib/utils"
import { YearPicker } from "@/components/year-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface MonthSummary {
  key: string
  income: number
  expenses: number
  count: number
}

interface CategoryRow {
  id: string
  name: string
  color: string
  total: number
  percent: number
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ jahr?: string }>
}) {
  const { jahr } = await searchParams
  const currentYear = new Date().getFullYear()
  const selectedYear = /^\d{4}$/.test(jahr ?? "") ? Number(jahr) : currentYear

  const user = await requireUser()
  const [t, tc, locale] = await Promise.all([
    getTranslations("archive"),
    getTranslations("common"),
    getLocale(),
  ])

  const data = await db.query.transactions.findMany({
    where: eq(transactions.userId, user.id),
    columns: { type: true, amount: true, date: true, categoryId: true },
    with: { category: { columns: { name: true, color: true } } },
  })

  const byMonth = new Map<string, MonthSummary>()
  const byYearCat = new Map<number, Map<string, CategoryRow>>()

  for (const tx of data) {
    const dateStr = String(tx.date)
    const monthKey = dateStr.slice(0, 7)
    const year = Number(dateStr.slice(0, 4))

    // Monatsübersicht
    const m = byMonth.get(monthKey) ?? { key: monthKey, income: 0, expenses: 0, count: 0 }
    if (tx.type === "income") m.income += tx.amount
    else m.expenses += tx.amount
    m.count++
    byMonth.set(monthKey, m)

    // Jahreskategorien (nur Ausgaben)
    if (tx.type === "expense") {
      if (!byYearCat.has(year)) byYearCat.set(year, new Map())
      const yearMap = byYearCat.get(year)!
      const catKey = tx.categoryId ?? "none"
      const row = yearMap.get(catKey) ?? {
        id: catKey,
        name: tx.category?.name ?? tc("noCategory"),
        color: tx.category?.color ?? "#94a3b8",
        total: 0,
        percent: 0,
      }
      row.total += tx.amount
      yearMap.set(catKey, row)
    }
  }

  const months = [...byMonth.values()].sort((a, b) => b.key.localeCompare(a.key))

  const availableYears = [
    ...new Set([currentYear, ...[...byYearCat.keys()]]),
  ].sort((a, b) => b - a)

  const yearCatMap = byYearCat.get(selectedYear) ?? new Map()
  const yearTotal = [...yearCatMap.values()].reduce((s, r) => s + r.total, 0)
  const categoryRows: CategoryRow[] = [...yearCatMap.values()]
    .map((r) => ({
      ...r,
      percent: yearTotal > 0 ? (r.total / yearTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* ── Monatsübersicht ───────────────────────────── */}
      <section className="grid gap-3">
        <h2 className="text-base font-semibold">{t("monthlyTitle")}</h2>

        {months.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t("empty")}
            </CardContent>
          </Card>
        )}

        {/* Mobile */}
        <div className="grid gap-3 md:hidden">
          {months.map((m) => {
            const [y, mo] = m.key.split("-").map(Number)
            const balance = m.income - m.expenses
            return (
              <Link key={m.key} href={`/transactions?monat=${m.key}`}>
                <Card className="py-4 transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between gap-3 px-4">
                    <div className="min-w-0">
                      <p className="font-medium">{formatMonth(y, mo, locale)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t("bookingCount", { count: m.count })}
                      </p>
                      <p className="mt-1 text-xs tabular-nums">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(m.income, locale)}
                        </span>{" "}
                        <span className="text-red-600 dark:text-red-400">
                          −{formatCurrency(m.expenses, locale)}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span
                        className={`font-semibold tabular-nums ${
                          balance >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatCurrency(balance, locale)}
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Desktop */}
        {months.length > 0 && (
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("month")}</TableHead>
                    <TableHead className="text-right">{tc("incomes")}</TableHead>
                    <TableHead className="text-right">{tc("expenses")}</TableHead>
                    <TableHead className="text-right">{tc("balance")}</TableHead>
                    <TableHead className="text-right">{t("bookings")}</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {months.map((m) => {
                    const [y, mo] = m.key.split("-").map(Number)
                    const balance = m.income - m.expenses
                    return (
                      <TableRow key={m.key}>
                        <TableCell className="font-medium">
                          {formatMonth(y, mo, locale)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(m.income, locale)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">
                          {formatCurrency(m.expenses, locale)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold tabular-nums ${
                            balance >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {formatCurrency(balance, locale)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {m.count}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/transactions?monat=${m.key}`}>
                              {t("details")} <ArrowRight />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Jahresausgaben nach Kategorie ─────────────── */}
      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{t("annualTitle")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("annualSubtitle", { year: selectedYear })}
            </p>
          </div>
          <YearPicker years={availableYears} selected={selectedYear} />
        </div>

        <Card>
          {categoryRows.length === 0 ? (
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t("noExpensesYear", { year: selectedYear })}
            </CardContent>
          ) : (
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("category")}</TableHead>
                    <TableHead className="hidden w-1/2 sm:table-cell" />
                    <TableHead className="text-right">{t("share")}</TableHead>
                    <TableHead className="text-right">{tc("amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span className="flex items-center gap-2 whitespace-nowrap font-medium">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: row.color }}
                          />
                          {row.name}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/15">
                          <div
                            className="h-full rounded-full bg-primary/60 transition-all"
                            style={{ width: `${row.percent}%` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.percent.toFixed(1)} %
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-red-600 dark:text-red-400">
                        {formatCurrency(row.total, locale)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={2} className="hidden sm:table-cell">
                      {t("yearTotal")}
                    </TableCell>
                    <TableCell className="sm:hidden">{t("yearTotal")}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      100 %
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">
                      {formatCurrency(yearTotal, locale)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      </section>
    </div>
  )
}

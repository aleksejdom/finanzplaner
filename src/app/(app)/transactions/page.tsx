import { getLocale, getTranslations } from "next-intl/server"
import { Repeat } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatDate, formatMonth } from "@/lib/utils"
import type { Category, Transaction } from "@/lib/types"
import { deleteTransaction } from "@/app/(app)/actions"
import { TransactionDialog } from "@/components/transaction-dialog"
import { DeleteButton } from "@/components/delete-button"
import { MonthPicker } from "@/components/month-picker"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ monat?: string }>
}) {
  const { monat } = await searchParams
  const selected = /^\d{4}-\d{2}$/.test(monat ?? "") ? monat! : currentMonthKey()
  const [year, month] = selected.split("-").map(Number)
  const firstDay = `${selected}-01`
  const lastDay = new Date(year, month, 0).toISOString().slice(0, 10)

  const supabase = await createClient()
  // Wiederkehrende Transaktionen für fehlende Monate nachträglich erzeugen
  await supabase.rpc("process_recurring_transactions")

  const [t, tc, locale] = await Promise.all([
    getTranslations("transactions"),
    getTranslations("common"),
    getLocale(),
  ])
  const [{ data: transactions }, { data: categories }, { data: allDates }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("*, categories(name, color)")
        .gte("date", firstDay)
        .lte("date", lastDay)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("transactions").select("date"),
    ])

  const txs = (transactions ?? []) as Transaction[]
  const cats = (categories ?? []) as Category[]

  // Alle Monate mit Daten + aktueller Monat für den Picker
  const months = new Set<string>([currentMonthKey(), selected])
  for (const row of allDates ?? []) months.add(String(row.date).slice(0, 7))
  const sortedMonths = [...months].sort().reverse()

  const income = txs
    .filter((tx) => tx.type === "income")
    .reduce((s, tx) => s + Number(tx.amount), 0)
  const expenses = txs
    .filter((tx) => tx.type === "expense")
    .reduce((s, tx) => s + Number(tx.amount), 0)

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatMonth(year, month, locale)} ·{" "}
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(income, locale)}
            </span>{" "}
            ·{" "}
            <span className="font-medium text-red-600 dark:text-red-400">
              −{formatCurrency(expenses, locale)}
            </span>
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <MonthPicker months={sortedMonths} selected={selected} />
          <TransactionDialog categories={cats} />
        </div>
      </div>

      {txs.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      )}

      {/* Mobile: Kartenliste */}
      {txs.length > 0 && (
        <Card className="py-2 md:hidden">
          <CardContent className="divide-y px-4">
            {txs.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-3">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tx.categories?.color ?? "#94a3b8" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {tx.description || tx.categories?.name || tc("transaction")}
                    {(tx.is_recurring || tx.recurring_source_id) && (
                      <Repeat
                        className={`size-3 shrink-0 ${tx.is_recurring ? "text-primary" : "text-muted-foreground"}`}
                      />
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDate(tx.date, locale)}
                    {tx.categories?.name ? ` · ${tx.categories.name}` : ""}
                  </p>
                  <p
                    className={`mt-0.5 text-sm font-semibold tabular-nums ${
                      tx.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "−"}
                    {formatCurrency(Number(tx.amount), locale)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <TransactionDialog categories={cats} transaction={tx} />
                  <DeleteButton
                    action={deleteTransaction.bind(null, tx.id)}
                    title={t("deleteTitle")}
                    description={t("deleteDescription")}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Desktop: Tabelle */}
      {txs.length > 0 && (
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("description")}</TableHead>
                  <TableHead>{t("category")}</TableHead>
                  <TableHead className="text-right">{tc("amount")}</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {txs.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(tx.date, locale)}
                    </TableCell>
                    <TableCell className="max-w-56 font-medium">
                      <span className="flex items-center gap-1.5 truncate">
                        {tx.description || "–"}
                        {(tx.is_recurring || tx.recurring_source_id) && (
                          <Repeat
                            className={`size-3 shrink-0 ${tx.is_recurring ? "text-primary" : "text-muted-foreground"}`}
                          />
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      {tx.categories ? (
                        <Badge variant="outline" className="gap-1.5 font-normal">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: tx.categories.color }}
                          />
                          {tx.categories.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold tabular-nums ${
                        tx.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "−"}
                      {formatCurrency(Number(tx.amount), locale)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-0.5">
                        <TransactionDialog categories={cats} transaction={tx} />
                        <DeleteButton
                          action={deleteTransaction.bind(null, tx.id)}
                          title={t("deleteTitle")}
                          description={t("deleteDescription")}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { getLocale, getTranslations } from "next-intl/server"
import { asc, desc, eq } from "drizzle-orm"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  PiggyBank,
  Wallet,
} from "lucide-react"
import { db } from "@/db"
import { savingsAccounts, savingsEntries } from "@/db/schema"
import { requireUser } from "@/lib/session"
import { formatCurrency, formatDate, formatMonth } from "@/lib/utils"
import { deleteSavingsAccount, deleteSavingsEntry } from "@/app/(app)/actions"
import { AccountDialog } from "@/components/account-dialog"
import { AccountTabs } from "@/components/account-tabs"
import { SavingsDialog } from "@/components/savings-dialog"
import { SavingsPeriodPicker } from "@/components/savings-period-picker"
import { DeleteButton } from "@/components/delete-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export default async function SavingsPage({
  searchParams,
}: {
  searchParams: Promise<{ konto?: string; monat?: string; jahr?: string }>
}) {
  const { konto, monat, jahr } = await searchParams

  const isYearMode = !!jahr && !monat
  const currentYear = new Date().getFullYear()
  const selectedMonth = /^\d{4}-\d{2}$/.test(monat ?? "")
    ? monat!
    : currentMonthKey()
  const selectedYear = /^\d{4}$/.test(jahr ?? "")
    ? Number(jahr)
    : currentYear
  const selectedAccountId = konto ?? null

  const user = await requireUser()
  const [t, tc, locale] = await Promise.all([
    getTranslations("savings"),
    getTranslations("common"),
    getLocale(),
  ])

  const [accounts, allEntries] = await Promise.all([
    db
      .select()
      .from(savingsAccounts)
      .where(eq(savingsAccounts.userId, user.id))
      .orderBy(asc(savingsAccounts.createdAt)),
    db.query.savingsEntries.findMany({
      where: eq(savingsEntries.userId, user.id),
      with: { account: { columns: { name: true, color: true } } },
      orderBy: [desc(savingsEntries.date), desc(savingsEntries.createdAt)],
    }),
  ])

  // Filter by selected account
  const accountEntries = selectedAccountId
    ? allEntries.filter((e) => e.accountId === selectedAccountId)
    : allEntries

  const selectedAccount = selectedAccountId
    ? accounts.find((a) => a.id === selectedAccountId) ?? null
    : null

  // All-time balance for selected scope
  const allTimeBalance = accountEntries.reduce(
    (s, e) => (e.direction === "deposit" ? s + e.amount : s - e.amount),
    0
  )

  // Period entries
  const periodPrefix = isYearMode ? String(selectedYear) : selectedMonth
  const periodEntries = accountEntries.filter((e) =>
    String(e.date).startsWith(periodPrefix)
  )

  const periodDeposits = periodEntries
    .filter((e) => e.direction === "deposit")
    .reduce((s, e) => s + e.amount, 0)
  const periodWithdrawals = periodEntries
    .filter((e) => e.direction === "withdrawal")
    .reduce((s, e) => s + e.amount, 0)

  // Available periods for the picker
  const monthSet = new Set<string>([currentMonthKey()])
  const yearSet = new Set<number>([currentYear])
  for (const e of accountEntries) {
    const d = String(e.date)
    monthSet.add(d.slice(0, 7))
    yearSet.add(Number(d.slice(0, 4)))
  }
  const availableMonths = [...monthSet].sort().reverse()
  const availableYears = [...yearSet].sort((a, b) => b - a)

  // Year view: monthly breakdown with running balance
  interface MonthRow {
    month: string
    deposits: number
    withdrawals: number
    runningBalance: number
  }
  const monthlyRows: MonthRow[] = []
  if (isYearMode) {
    // Starting balance = everything before selected year
    let running = accountEntries
      .filter((e) => Number(String(e.date).slice(0, 4)) < selectedYear)
      .reduce(
        (s, e) => (e.direction === "deposit" ? s + e.amount : s - e.amount),
        0
      )

    const byMonth = new Map<string, { deposits: number; withdrawals: number }>()
    for (const e of periodEntries) {
      const m = String(e.date).slice(0, 7)
      const cur = byMonth.get(m) ?? { deposits: 0, withdrawals: 0 }
      if (e.direction === "deposit") cur.deposits += e.amount
      else cur.withdrawals += e.amount
      byMonth.set(m, cur)
    }
    for (const [month, vals] of [...byMonth.entries()].sort((a, b) =>
      a[0].localeCompare(b[0])
    )) {
      running += vals.deposits - vals.withdrawals
      monthlyRows.push({ month, ...vals, runningBalance: running })
    }
  }

  // No accounts yet
  if (accounts.length === 0) {
    return (
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <AccountDialog />
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Wallet className="size-12 text-muted-foreground/30" />
            <div>
              <p className="font-medium">{t("noAccounts")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("noAccountsHint")}
              </p>
            </div>
            <AccountDialog />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <AccountDialog />
      </div>

      {/* Account Tabs */}
      <AccountTabs accounts={accounts} selectedId={selectedAccountId} />

      {/* Selected account actions */}
      {selectedAccount && (
        <div className="flex items-center gap-2">
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: selectedAccount.color }}
          />
          <span className="font-medium">{selectedAccount.name}</span>
          <AccountDialog account={selectedAccount} />
          <DeleteButton
            action={deleteSavingsAccount.bind(null, selectedAccount.id)}
            title={t("accountDeleteTitle")}
            description={t("accountDeleteDesc")}
          />
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("balance")}
            </CardTitle>
            <PiggyBank className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-primary">
              {formatCurrency(allTimeBalance, locale)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("deposits")}
            </CardTitle>
            <ArrowDownToLine className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(periodDeposits, locale)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("withdrawals")}
            </CardTitle>
            <ArrowUpFromLine className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
              {formatCurrency(periodWithdrawals, locale)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period picker + new entry button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SavingsPeriodPicker
          mode={isYearMode ? "year" : "month"}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          availableMonths={availableMonths}
          availableYears={availableYears}
        />
        {accounts.length > 0 && (
          <SavingsDialog
            accounts={accounts}
            accountId={selectedAccountId ?? undefined}
          />
        )}
      </div>

      {/* ── Jahresansicht ─────────────────────────────── */}
      {isYearMode && (
        <>
          {monthlyRows.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {t("noEntriesPeriod")}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("month")}</TableHead>
                      <TableHead className="text-right">
                        {t("deposits")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("withdrawals")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("netChange")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("runningBalance")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyRows.map((row) => {
                      const [y, mo] = row.month.split("-").map(Number)
                      const net = row.deposits - row.withdrawals
                      return (
                        <TableRow key={row.month}>
                          <TableCell className="font-medium">
                            {formatMonth(y, mo, locale)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(row.deposits, locale)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">
                            {formatCurrency(row.withdrawals, locale)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium tabular-nums ${
                              net >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {net >= 0 ? "+" : "−"}
                            {formatCurrency(Math.abs(net), locale)}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums text-primary">
                            {formatCurrency(row.runningBalance, locale)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    <TableRow className="bg-muted/40 font-semibold">
                      <TableCell>Gesamt {selectedYear}</TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(periodDeposits, locale)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">
                        {formatCurrency(periodWithdrawals, locale)}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums ${
                          periodDeposits - periodWithdrawals >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {periodDeposits - periodWithdrawals >= 0 ? "+" : "−"}
                        {formatCurrency(
                          Math.abs(periodDeposits - periodWithdrawals),
                          locale
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-primary">
                        {formatCurrency(allTimeBalance, locale)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── Monatsansicht ─────────────────────────────── */}
      {!isYearMode && (
        <>
          {periodEntries.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {t("noEntriesPeriod")}
              </CardContent>
            </Card>
          ) : (
            <Card className="py-2">
              <CardContent className="divide-y px-4">
                {periodEntries.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 py-3">
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                        e.direction === "deposit"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {e.direction === "deposit" ? (
                        <ArrowDownToLine className="size-4" />
                      ) : (
                        <ArrowUpFromLine className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {e.description ||
                          (e.direction === "deposit"
                            ? t("deposit")
                            : t("withdrawal"))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(e.date, locale)}
                        {!selectedAccountId && e.account ? (
                          <>
                            {" · "}
                            <span
                              className="inline-block size-1.5 rounded-full align-middle"
                              style={{ backgroundColor: e.account.color }}
                            />{" "}
                            {e.account.name}
                          </>
                        ) : null}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        e.direction === "deposit"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {e.direction === "deposit" ? "+" : "−"}
                      {formatCurrency(e.amount, locale)}
                    </span>
                    <div className="flex shrink-0 gap-0.5">
                      <SavingsDialog
                        accounts={accounts}
                        accountId={e.accountId ?? undefined}
                        entry={e}
                      />
                      <DeleteButton
                        action={deleteSavingsEntry.bind(null, e.id)}
                        title={t("deleteTitle")}
                        description={t("deleteDescription")}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

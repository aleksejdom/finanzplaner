import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"
import { and, asc, desc, eq, gte, lte } from "drizzle-orm"
import {
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  ArrowRight,
  PiggyBank,
} from "lucide-react"
import { db } from "@/db"
import { categories, savingsAccounts, transactions } from "@/db/schema"
import { requireUser } from "@/lib/session"
import { processRecurringTransactions } from "@/lib/recurring"
import { formatCurrency, formatDate, formatMonth } from "@/lib/utils"
import type { Category, SavingsAccount, SavingsEntry, Transaction } from "@/lib/types"
import { TransactionDialog } from "@/components/transaction-dialog"
import {
  ExpenseBreakdown,
  type ExpenseGroup,
} from "@/components/expense-breakdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function DashboardPage() {
  const user = await requireUser()
  await processRecurringTransactions(user.id)

  const [t, tc, locale] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("common"),
    getLocale(),
  ])

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).toISOString().slice(0, 10)

  const [txs, cats, savingsAccountsData] = await Promise.all([
    db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, user.id),
        gte(transactions.date, firstDay),
        lte(transactions.date, lastDay)
      ),
      with: { category: { columns: { name: true, color: true } } },
      orderBy: [desc(transactions.date), desc(transactions.createdAt)],
    }),
    db
      .select()
      .from(categories)
      .where(eq(categories.userId, user.id))
      .orderBy(asc(categories.name)),
    db.query.savingsAccounts.findMany({
      where: eq(savingsAccounts.userId, user.id),
      with: { entries: { columns: { direction: true, amount: true } } },
      orderBy: [asc(savingsAccounts.createdAt)],
    }),
  ])

  const income = txs
    .filter((tx) => tx.type === "income")
    .reduce((s, tx) => s + Number(tx.amount), 0)
  const expenses = txs
    .filter((tx) => tx.type === "expense")
    .reduce((s, tx) => s + Number(tx.amount), 0)
  const balance = income - expenses

  type AccountWithBalance = Pick<SavingsAccount, "id" | "name" | "color"> & {
    balance: number
  }
  const savingsAccountsList: AccountWithBalance[] = savingsAccountsData.map(
    (acc) => {
      const entries = acc.entries as Pick<SavingsEntry, "direction" | "amount">[]
      const bal = entries.reduce(
        (s, e) =>
          e.direction === "deposit" ? s + Number(e.amount) : s - Number(e.amount),
        0
      )
      return { id: acc.id, name: acc.name, color: acc.color, balance: bal }
    }
  )
  const savingsBalance = savingsAccountsList.reduce((s, a) => s + a.balance, 0)

  // Ausgaben nach Kategorie inkl. Einzelbuchungen (aufklappbar)
  const byCategory = new Map<
    string,
    { name: string; color: string; sum: number; items: Transaction[] }
  >()
  for (const tx of txs as unknown as Transaction[]) {
    if (tx.type !== "expense") continue
    const key = tx.categoryId ?? "none"
    const entry = byCategory.get(key) ?? {
      name: tx.category?.name ?? tc("noCategory"),
      color: tx.category?.color ?? "#94a3b8",
      sum: 0,
      items: [],
    }
    entry.sum += Number(tx.amount)
    entry.items.push(tx)
    byCategory.set(key, entry)
  }
  const expenseGroups: ExpenseGroup[] = [...byCategory.entries()]
    .sort((a, b) => b[1].sum - a[1].sum)
    .map(([key, g]) => ({
      key,
      name: g.name,
      color: g.color,
      sum: formatCurrency(g.sum, locale),
      percent: expenses > 0 ? (g.sum / expenses) * 100 : 0,
      items: g.items.map((tx) => ({
        id: tx.id,
        label: tx.description || tc("transaction"),
        sub: formatDate(tx.date, locale),
        amount: formatCurrency(Number(tx.amount), locale),
      })),
    }))

  const statCards = [
    {
      key: "income",
      title: tc("incomes"),
      value: formatCurrency(income, locale),
      icon: <ArrowUpRight className="size-4 text-emerald-500" />,
      className: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "expenses",
      title: tc("expenses"),
      value: formatCurrency(expenses, locale),
      icon: <ArrowDownRight className="size-4 text-red-500" />,
      className: "text-red-600 dark:text-red-400",
    },
    {
      key: "balance",
      title: tc("balance"),
      value: formatCurrency(balance, locale),
      icon: <Scale className="size-4 text-muted-foreground" />,
      className:
        balance >= 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400",
    },
    {
      key: "savings",
      title: t("savingsAccount"),
      value: formatCurrency(savingsBalance, locale),
      icon: <PiggyBank className="size-4 text-primary" />,
      className: "text-primary",
      href: "/savings",
    },
  ]

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle", { month: formatMonth(year, month, locale) })}
          </p>
        </div>
        <TransactionDialog categories={cats as Category[]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const content = (
            <Card
              key={card.key}
              className={card.href ? "h-full transition-colors hover:bg-muted/50" : undefined}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                {card.icon}
              </CardHeader>
              <CardContent>
                <p
                  className={`text-2xl font-semibold tabular-nums ${card.className}`}
                >
                  {card.value}
                </p>
              </CardContent>
            </Card>
          )
          return card.href ? (
            <Link key={card.key} href={card.href}>
              {content}
            </Link>
          ) : (
            content
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {t("recentTransactions")}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions">
                {t("all")} <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {txs.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("emptyMonth")}
              </p>
            )}
            {txs.slice(0, 6).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: tx.category?.color ?? "#94a3b8" }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {tx.description || tx.category?.name || tc("transaction")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.date, locale)}
                      {tx.category?.name ? ` · ${tx.category.name}` : ""}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    tx.type === "income"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {tx.type === "income" ? "+" : "−"}
                  {formatCurrency(Number(tx.amount), locale)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("expensesByCategory")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {expenseGroups.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("emptyExpenses")}
              </p>
            ) : (
              <>
                <ExpenseBreakdown groups={expenseGroups} />
                <Badge variant="secondary" className="justify-self-start">
                  {t("total", { amount: formatCurrency(expenses, locale) })}
                </Badge>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Sparkonten ────────────────────────────────── */}
      {savingsAccountsList.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t("savingsAccounts")}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/savings">
                {t("all")} <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {savingsAccountsList.map((acc) => (
              <Link
                key={acc.id}
                href={`/savings?konto=${acc.id}`}
                className="flex items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${acc.color}20` }}
                  >
                    <PiggyBank
                      className="size-4"
                      style={{ color: acc.color }}
                    />
                  </span>
                  <span className="text-sm font-medium">{acc.name}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-primary">
                  {formatCurrency(acc.balance, locale)}
                </span>
              </Link>
            ))}
            {savingsAccountsList.length > 1 && (
              <div className="flex items-center justify-between border-t pt-2 text-sm">
                <span className="text-muted-foreground">
                  {t("savingsTotal")}
                </span>
                <span className="font-semibold tabular-nums text-primary">
                  {formatCurrency(savingsBalance, locale)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

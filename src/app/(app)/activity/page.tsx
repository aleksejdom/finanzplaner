import { getLocale, getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatDate, formatTimestamp } from "@/lib/utils"
import type { ActivityLogEntry } from "@/lib/types"
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

const ACTION_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = {
  created: "default",
  updated: "secondary",
  deleted: "destructive",
}

export default async function ActivityPage() {
  const supabase = await createClient()
  const [t, tc, locale] = await Promise.all([
    getTranslations("activity"),
    getTranslations("common"),
    getLocale(),
  ])
  const { data } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)

  const entries = (data ?? []) as ActivityLogEntry[]

  const actionLabel = (action: string) =>
    action === "created" || action === "updated" || action === "deleted"
      ? t(action)
      : action

  const typeLabel = (e: ActivityLogEntry) =>
    e.entity === "savings"
      ? e.details.direction === "deposit"
        ? t("savingsDeposit")
        : t("savingsWithdrawal")
      : e.details.type === "income"
        ? tc("income")
        : tc("expense")

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {entries.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      )}

      {/* Mobile: Kartenliste */}
      {entries.length > 0 && (
        <Card className="py-2 md:hidden">
          <CardContent className="divide-y px-4">
            {entries.map((e) => (
              <div key={e.id} className="flex items-start gap-3 py-3">
                <Badge
                  variant={ACTION_VARIANTS[e.action] ?? "secondary"}
                  className="mt-0.5 shrink-0"
                >
                  {actionLabel(e.action)}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {e.details.description || tc("transaction")}
                    </p>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {e.details.amount != null
                        ? formatCurrency(Number(e.details.amount), locale)
                        : "–"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {typeLabel(e)}
                    {e.details.date
                      ? ` · ${formatDate(e.details.date, locale)}`
                      : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatTimestamp(e.created_at, locale)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Desktop: Tabelle */}
      {entries.length > 0 && (
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("time")}</TableHead>
                  <TableHead>{t("action")}</TableHead>
                  <TableHead>{t("details")}</TableHead>
                  <TableHead className="text-right">{tc("amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatTimestamp(e.created_at, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANTS[e.action] ?? "secondary"}>
                        {actionLabel(e.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-64">
                      <span className="block truncate font-medium">
                        {e.details.description || tc("transaction")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {typeLabel(e)}
                        {e.details.date
                          ? ` · ${formatDate(e.details.date, locale)}`
                          : ""}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {e.details.amount != null
                        ? formatCurrency(Number(e.details.amount), locale)
                        : "–"}
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

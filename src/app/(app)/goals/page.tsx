import { getLocale, getTranslations } from "next-intl/server"
import { desc, eq } from "drizzle-orm"
import { PiggyBank, TrendingUp } from "lucide-react"
import { db } from "@/db"
import { savingsGoals } from "@/db/schema"
import { requireUser } from "@/lib/session"
import { calculateSavingsPlan } from "@/lib/savings"
import { formatCurrency } from "@/lib/utils"
import { deleteGoal } from "@/app/(app)/actions"
import { GoalDialog } from "@/components/goal-dialog"
import { DeleteButton } from "@/components/delete-button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

export default async function GoalsPage() {
  const user = await requireUser()
  const [t, locale] = await Promise.all([
    getTranslations("goals"),
    getLocale(),
  ])
  const goals = await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.userId, user.id))
    .orderBy(desc(savingsGoals.createdAt))

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <GoalDialog />
      </div>

      {goals.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <PiggyBank className="size-10 text-muted-foreground" />
            <p className="font-medium">{t("emptyTitle")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("emptyText")}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => {
          const plan = calculateSavingsPlan({
            targetAmount: g.targetAmount,
            initialAmount: g.initialAmount,
            currentAge: g.currentAge,
            targetAge: g.targetAge,
            etfEnabled: g.etfEnabled,
            etfAnnualReturn: g.etfAnnualReturn,
          })
          const progress = (g.initialAmount / g.targetAmount) * 100

          return (
            <Card key={g.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{g.name}</CardTitle>
                    <CardDescription>
                      {t("goalSummary", {
                        amount: formatCurrency(g.targetAmount, locale),
                        targetAge: g.targetAge,
                        currentAge: g.currentAge,
                      })}
                    </CardDescription>
                  </div>
                  <DeleteButton
                    action={deleteGoal.bind(null, g.id)}
                    title={t("deleteTitle", { name: g.name })}
                    description={t("deleteDescription")}
                  />
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                {g.etfEnabled && (
                  <Badge variant="secondary" className="justify-self-start gap-1">
                    <TrendingUp className="size-3" />
                    {t("etfBadge", { rate: g.etfAnnualReturn })}
                  </Badge>
                )}

                {plan && (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">
                      {t("monthlyRate")}
                    </p>
                    <p className="text-2xl font-semibold tabular-nums text-primary">
                      {formatCurrency(
                        plan.monthlyWithReturn ?? plan.monthlyWithoutReturn,
                        locale
                      )}
                    </p>
                    {plan.monthlyWithReturn !== null && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("withoutEtfHint", {
                          amount: formatCurrency(
                            plan.monthlyWithoutReturn,
                            locale
                          ),
                          saved: formatCurrency(
                            plan.monthlyWithoutReturn - plan.monthlyWithReturn,
                            locale
                          ),
                        })}
                      </p>
                    )}
                  </div>
                )}

                <Separator />

                <div className="grid gap-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("initialCapital")}
                    </span>
                    <span className="tabular-nums">
                      {formatCurrency(g.initialAmount, locale)}
                    </span>
                  </div>
                  {plan && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("totalContributions")}
                        </span>
                        <span className="tabular-nums">
                          {formatCurrency(plan.totalContributions, locale)}
                        </span>
                      </div>
                      {plan.expectedGains !== null && plan.expectedGains > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {t("expectedGains")}
                          </span>
                          <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(plan.expectedGains, locale)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("duration")}
                        </span>
                        <span className="tabular-nums">
                          {t("months", { count: plan.months })}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t("progress")}</span>
                    <span>{Math.min(100, Math.round(progress))} %</span>
                  </div>
                  <Progress value={Math.min(100, progress)} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

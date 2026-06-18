"use client"

import { useState, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Plus, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { createGoal } from "@/app/(app)/actions"
import { calculateSavingsPlan } from "@/lib/savings"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function GoalDialog() {
  const t = useTranslations("goalDialog")
  const tc = useTranslations("common")
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const [currentAge, setCurrentAge] = useState(30)
  const [targetAge, setTargetAge] = useState(40)
  const [targetAmount, setTargetAmount] = useState(50000)
  const [initialAmount, setInitialAmount] = useState(0)
  const [etfEnabled, setEtfEnabled] = useState(true)
  const [etfReturn, setEtfReturn] = useState(7)

  const plan = calculateSavingsPlan({
    targetAmount,
    initialAmount,
    currentAge,
    targetAge,
    etfEnabled,
    etfAnnualReturn: etfReturn,
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createGoal(formData)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(t("created"))
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          {t("newButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="goal-name">{t("nameLabel")}</Label>
            <Input
              id="goal-name"
              name="name"
              required
              placeholder={t("namePlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="current_age">{t("currentAge")}</Label>
              <Input
                id="current_age"
                name="current_age"
                type="number"
                min={0}
                max={120}
                required
                value={currentAge}
                onChange={(e) => setCurrentAge(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target_age">{t("targetAge")}</Label>
              <Input
                id="target_age"
                name="target_age"
                type="number"
                min={1}
                max={120}
                required
                value={targetAge}
                onChange={(e) => setTargetAge(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="target_amount">{t("targetAmount")}</Label>
              <Input
                id="target_amount"
                name="target_amount"
                type="number"
                min={1}
                step="1"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="initial_amount">{t("initialAmount")}</Label>
              <Input
                id="initial_amount"
                name="initial_amount"
                type="number"
                min={0}
                step="1"
                value={initialAmount}
                onChange={(e) => setInitialAmount(Number(e.target.value))}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <Label htmlFor="etf_enabled">{t("etfToggle")}</Label>
            </div>
            <input
              id="etf_enabled"
              name="etf_enabled"
              type="checkbox"
              checked={etfEnabled}
              onChange={(e) => setEtfEnabled(e.target.checked)}
              className="size-4 accent-primary"
            />
          </div>
          {etfEnabled && (
            <div className="grid gap-2">
              <Label htmlFor="etf_annual_return">{t("etfReturnLabel")}</Label>
              <Input
                id="etf_annual_return"
                name="etf_annual_return"
                type="number"
                min={0}
                max={30}
                step="0.1"
                value={etfReturn}
                onChange={(e) => setEtfReturn(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">{t("etfHint")}</p>
            </div>
          )}

          {plan && (
            <div className="rounded-lg border bg-muted/50 p-4 text-sm">
              <p className="mb-2 font-medium">{t("previewTitle")}</p>
              <div className="grid gap-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("withoutReturn")}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(plan.monthlyWithoutReturn, locale)}
                  </span>
                </div>
                {plan.monthlyWithReturn !== null && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("withEtf", { rate: etfReturn })}
                      </span>
                      <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(plan.monthlyWithReturn, locale)}
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
                  </>
                )}
                <div className="flex justify-between border-t pt-1.5">
                  <span className="text-muted-foreground">{t("duration")}</span>
                  <span className="tabular-nums">
                    {t("durationValue", {
                      months: plan.months,
                      years: targetAge - currentAge,
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending || !plan} className="w-full">
              {pending ? tc("saving") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

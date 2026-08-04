"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Plus, Pencil, Repeat } from "lucide-react"
import { toast } from "sonner"
import { createTransaction, updateTransaction } from "@/app/(app)/actions"
import type { Category, Transaction, TransactionType } from "@/lib/types"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function TransactionDialog({
  categories,
  transaction,
}: {
  categories: Category[]
  transaction?: Transaction
}) {
  const isEdit = !!transaction
  const isCopy = !!transaction?.recurringSourceId
  const t = useTranslations("transactionDialog")
  const tc = useTranslations("common")
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? "expense"
  )
  const [isRecurring, setIsRecurring] = useState(
    transaction?.isRecurring ?? false
  )
  const [pending, startTransition] = useTransition()

  const filteredCategories = categories.filter((c) => c.type === type)
  const today = new Date().toISOString().slice(0, 10)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("type", type)

    formData.set("is_recurring", isRecurring ? "on" : "off")

    startTransition(async () => {
      const result = isEdit
        ? await updateTransaction(transaction.id, formData)
        : await createTransaction(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(isEdit ? t("updated") : t("saved"))
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon-sm" aria-label={tc("edit")}>
            <Pencil />
          </Button>
        ) : (
          <Button>
            <Plus />
            {t("newButton")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
            <TabsList className="w-full">
              <TabsTrigger value="expense" className="flex-1">
                {tc("expense")}
              </TabsTrigger>
              <TabsTrigger value="income" className="flex-1">
                {tc("income")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="grid gap-2">
            <Label htmlFor="amount">{t("amountLabel")}</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              defaultValue={transaction?.amount}
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("categoryLabel")}</Label>
            <Select
              name="category_id"
              key={type}
              defaultValue={
                transaction?.type === type
                  ? (transaction?.categoryId ?? undefined)
                  : undefined
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span
                      className="inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">{t("descriptionLabel")}</Label>
            <Input
              id="description"
              name="description"
              placeholder={t("descriptionPlaceholder")}
              defaultValue={transaction?.description}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">{t("dateLabel")}</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={transaction?.date ?? today}
            />
          </div>
          {isCopy ? (
            <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
              <Repeat className="size-4 shrink-0" />
              {t("recurringCopyNote")}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="size-4 text-primary" />
                <Label htmlFor="is_recurring">{t("recurringLabel")}</Label>
              </div>
              <input
                id="is_recurring"
                name="is_recurring"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="size-4 accent-primary"
              />
            </div>
          )}
          {isRecurring && !isCopy && (
            <p className="text-xs text-muted-foreground">
              {t("recurringHint")}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? tc("saving") : tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

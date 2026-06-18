"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Plus, Pencil } from "lucide-react"
import { toast } from "sonner"
import { createCategory, updateCategory } from "@/app/(app)/actions"
import type { Category, TransactionType } from "@/lib/types"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981",
  "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
  "#64748b", "#94a3b8",
]

export function CategoryDialog({ category }: { category?: Category }) {
  const isEdit = !!category
  const t = useTranslations("categoryDialog")
  const tc = useTranslations("common")
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<TransactionType>(category?.type ?? "expense")
  const [color, setColor] = useState(category?.color ?? COLORS[6])
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("type", type)
    formData.set("color", color)

    startTransition(async () => {
      const result = isEdit
        ? await updateCategory(category.id, formData)
        : await createCategory(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(isEdit ? t("updated") : t("created"))
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
          {!isEdit && (
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
          )}
          <div className="grid gap-2">
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder={t("namePlaceholder")}
              defaultValue={category?.name}
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("colorLabel")}</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="size-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : "none",
                    outlineOffset: 2,
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
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

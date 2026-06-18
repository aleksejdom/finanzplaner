"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Plus, Pencil } from "lucide-react"
import { toast } from "sonner"
import { createSavingsAccount, updateSavingsAccount } from "@/app/(app)/actions"
import type { SavingsAccount } from "@/lib/types"
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

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981",
  "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
  "#64748b", "#94a3b8",
]

export function AccountDialog({ account }: { account?: SavingsAccount }) {
  const isEdit = !!account
  const t = useTranslations("savings")
  const tc = useTranslations("common")
  const [open, setOpen] = useState(false)
  const [color, setColor] = useState(account?.color ?? COLORS[7])
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("color", color)

    startTransition(async () => {
      const result = isEdit
        ? await updateSavingsAccount(account.id, formData)
        : await createSavingsAccount(formData)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(isEdit ? t("accountUpdated") : t("accountCreated"))
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
            {t("accountButton")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("accountEditTitle") : t("accountNewTitle")}
          </DialogTitle>
          <DialogDescription>{t("accountSubtitle")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="account-name">{t("accountNameLabel")}</Label>
            <Input
              id="account-name"
              name="name"
              required
              placeholder={t("accountNamePlaceholder")}
              defaultValue={account?.name}
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("accountColorLabel")}</Label>
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

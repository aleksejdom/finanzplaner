"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Plus, Pencil } from "lucide-react"
import { toast } from "sonner"
import { createSavingsEntry, updateSavingsEntry } from "@/app/(app)/actions"
import type { SavingsAccount, SavingsDirection, SavingsEntry } from "@/lib/types"
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

export function SavingsDialog({
  accounts,
  accountId,
  entry,
}: {
  accounts: SavingsAccount[]
  accountId?: string
  entry?: SavingsEntry
}) {
  const isEdit = !!entry
  const t = useTranslations("savings")
  const tc = useTranslations("common")
  const [open, setOpen] = useState(false)
  const [direction, setDirection] = useState<SavingsDirection>(
    entry?.direction ?? "deposit"
  )
  const [selectedAccount, setSelectedAccount] = useState(
    entry?.account_id ?? accountId ?? accounts[0]?.id ?? ""
  )
  const [pending, startTransition] = useTransition()

  const today = new Date().toISOString().slice(0, 10)
  // Show account selector when not pre-selected (Alle Konten) or in edit mode
  const showAccountSelect = accounts.length > 0 && (!accountId || isEdit)
  // The pre-selected account object (shown as static info when no selector)
  const preselectedAccount = !showAccountSelect
    ? accounts.find((a) => a.id === (selectedAccount || accountId))
    : null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("direction", direction)
    if (selectedAccount) formData.set("account_id", selectedAccount)

    startTransition(async () => {
      const result = isEdit
        ? await updateSavingsEntry(entry.id, formData)
        : await createSavingsEntry(formData)
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
            {t("newEntry")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editEntry") : t("newEntry")}</DialogTitle>
          <DialogDescription>{t("dialogSubtitle")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Tabs
            value={direction}
            onValueChange={(v) => setDirection(v as SavingsDirection)}
          >
            <TabsList className="w-full">
              <TabsTrigger value="deposit" className="flex-1">
                {t("deposit")}
              </TabsTrigger>
              <TabsTrigger value="withdrawal" className="flex-1">
                {t("withdrawal")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {showAccountSelect ? (
            <div className="grid gap-2">
              <Label>{t("accountLabel")}</Label>
              <Select
                value={selectedAccount}
                onValueChange={setSelectedAccount}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("accountPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: acc.color }}
                      />
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : preselectedAccount ? (
            <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: preselectedAccount.color }}
              />
              <span className="font-medium">{preselectedAccount.name}</span>
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="savings-amount">{t("amountLabel")}</Label>
            <Input
              id="savings-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              defaultValue={entry?.amount}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="savings-description">{t("descriptionLabel")}</Label>
            <Input
              id="savings-description"
              name="description"
              placeholder={t("descriptionPlaceholder")}
              defaultValue={entry?.description}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="savings-date">{t("dateLabel")}</Label>
            <Input
              id="savings-date"
              name="date"
              type="date"
              required
              defaultValue={entry?.date ?? today}
            />
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

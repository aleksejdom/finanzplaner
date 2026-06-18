"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
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

export function DeleteButton({
  action,
  title,
  description,
}: {
  action: () => Promise<{ error?: string }>
  title: string
  description: string
}) {
  const t = useTranslations("common")
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(t("deleted"))
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("delete")}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending ? t("deleting") : t("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

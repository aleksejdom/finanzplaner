import { getTranslations } from "next-intl/server"
import { asc, eq } from "drizzle-orm"
import { db } from "@/db"
import { categories } from "@/db/schema"
import { requireUser } from "@/lib/session"
import type { Category } from "@/lib/types"
import { deleteCategory } from "@/app/(app)/actions"
import { CategoryDialog } from "@/components/category-dialog"
import { DeleteButton } from "@/components/delete-button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function CategoryList({
  items,
  emptyText,
  deleteTitle,
  deleteDescription,
}: {
  items: Category[]
  emptyText: string
  deleteTitle: (name: string) => string
  deleteDescription: string
}) {
  if (items.length === 0)
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    )
  return (
    <ul className="grid gap-1">
      {items.map((c) => (
        <li
          key={c.id}
          className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted/60"
        >
          <span className="flex items-center gap-3 text-sm font-medium">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: c.color }}
            />
            {c.name}
          </span>
          <span className="flex gap-0.5">
            <CategoryDialog category={c} />
            <DeleteButton
              action={deleteCategory.bind(null, c.id)}
              title={deleteTitle(c.name)}
              description={deleteDescription}
            />
          </span>
        </li>
      ))}
    </ul>
  )
}

export default async function CategoriesPage() {
  const user = await requireUser()
  const [t, tc] = await Promise.all([
    getTranslations("categories"),
    getTranslations("common"),
  ])
  const items = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, user.id))
    .orderBy(asc(categories.name))

  const listProps = {
    emptyText: t("empty"),
    deleteTitle: (name: string) => t("deleteTitle", { name }),
    deleteDescription: t("deleteDescription"),
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <CategoryDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-emerald-600 dark:text-emerald-400">
              {tc("incomes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryList
              items={items.filter((c) => c.type === "income")}
              {...listProps}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-600 dark:text-red-400">
              {tc("expenses")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryList
              items={items.filter((c) => c.type === "expense")}
              {...listProps}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

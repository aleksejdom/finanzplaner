"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Coins,
  PiggyBank,
  Archive,
  ScrollText,
} from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/transactions", key: "transactions", icon: ArrowLeftRight },
  { href: "/categories", key: "categories", icon: Tags },
  { href: "/savings", key: "savings", icon: Coins },
  { href: "/goals", key: "goals", icon: PiggyBank },
  { href: "/archive", key: "archive", icon: Archive },
  { href: "/activity", key: "activity", icon: ScrollText },
] as const

export function Nav() {
  const pathname = usePathname()
  const t = useTranslations("nav")

  return (
    <nav className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-col md:gap-1.5">
      {links.map(({ href, key, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            <span>{t(key)}</span>
          </Link>
        )
      })}
    </nav>
  )
}

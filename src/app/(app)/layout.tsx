import { Brand } from "@/components/logo"
import { Nav } from "@/components/nav"
import { LogoutButton } from "@/components/logout-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { requireUser } from "@/lib/session"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()

  const name = user.name || user.email || "Konto"
  const initials = name
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="sticky top-0 z-20 border-b border-sidebar-border bg-sidebar backdrop-blur-xl md:static md:flex md:w-60 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <Brand />
          <div className="flex items-center gap-1 md:hidden">
            <LocaleSwitcher />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
        <div className="px-3 pb-3 md:flex-1">
          <Nav />
        </div>
        <div className="hidden items-center justify-between gap-2 border-t border-sidebar-border px-4 py-3 md:flex">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">{name}</span>
          </div>
          <div className="flex shrink-0 items-center">
            <LocaleSwitcher />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

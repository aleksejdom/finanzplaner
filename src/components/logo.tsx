import { cn } from "@/lib/utils"

// Minimalistisches Logo: aufsteigender Kurs-/Flugpfad mit Zielpunkt
// auf dunklem, abgerundetem Quadrat – passend zum grünen Fintech-Theme.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id="fp-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#0c1410" />
      <path
        d="M14 45 L28 29 L37 36 L49 19"
        fill="none"
        stroke="url(#fp-grad)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="49" cy="19" r="4.5" fill="#4ade80" />
    </svg>
  )
}

export function Brand({
  markClassName = "size-9",
  nameClassName = "text-lg",
  className,
}: {
  markClassName?: string
  nameClassName?: string
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark
        className={cn(
          "shrink-0 rounded-lg shadow-[0_0_24px] shadow-primary/40",
          markClassName
        )}
      />
      <div className="leading-tight">
        <span
          className={cn("block font-semibold tracking-tight", nameClassName)}
        >
          FinanzPilot
        </span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          by Domowets
        </span>
      </div>
    </div>
  )
}

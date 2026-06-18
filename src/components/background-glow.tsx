// Dekorative, weich verlaufende Lichtflecken im Hintergrund (Glassmorphism-Look)
export function BackgroundGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -top-32 right-[-12%] size-[30rem] rounded-full bg-primary/20 blur-[140px] dark:bg-primary/15" />
      <div className="absolute bottom-[-18%] left-[-12%] size-[26rem] rounded-full bg-emerald-400/15 blur-[140px] dark:bg-emerald-500/10" />
      <div className="absolute top-1/3 left-1/2 size-72 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
    </div>
  )
}

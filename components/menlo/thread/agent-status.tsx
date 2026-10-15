'use client'

// A single calm line showing what Menlo is doing right now — never
// chain-of-thought, never a loud loading screen. It stands in for the old
// full-screen "understanding" moment inside the thread.
export function AgentStatus({ status }: { status: string }) {
  return (
    <div className="flex animate-fade items-center gap-3">
      <span
        aria-hidden
        className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10"
      >
        <span className="size-1.5 rounded-full bg-primary animate-pulse-dot" />
      </span>
      <span className="text-sm text-muted-foreground">{status}</span>
    </div>
  )
}

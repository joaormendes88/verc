'use client'

import { useMenlo } from '@/lib/menlo/store'
import { MonoLabel } from '@/components/menlo/ui/primitives'

// A direct financial answer — the response to "Quanto? / Quantos?". It is
// deliberately not a full workspace: the number that answers the question
// leads, with just enough context and an optional breakdown.
export function MetricSurface() {
  const { state } = useMenlo()
  const m = state.metric
  if (!m) return null

  return (
    <section className="animate-surface">
      <MonoLabel>{m.label}</MonoLabel>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-balance text-4xl font-semibold tracking-tight tabular text-foreground md:text-5xl">
          {m.value}
        </span>
        {m.delta ? <span className="text-sm font-medium text-primary">{m.delta}</span> : null}
      </div>
      <p className="mt-3 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
        {m.context}
      </p>

      {m.breakdown && m.breakdown.length > 0 ? (
        <dl className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {m.breakdown.map((b) => (
            <div key={b.label} className="flex flex-col gap-1 bg-card px-4 py-3.5">
              <dt className="text-mono-label text-muted-foreground">{b.label}</dt>
              <dd className="text-lg font-semibold tabular">{b.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  )
}

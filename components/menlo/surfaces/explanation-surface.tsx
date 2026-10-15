'use client'

import { useMenlo } from '@/lib/menlo/store'
import { MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { CornerDownRight } from 'lucide-react'

// A concise operational explanation — the answer to "Por quê?". It states the
// factors that were weighed and the conclusion. It never exposes private
// chain-of-thought; these are the load-bearing reasons, not the reasoning.
export function ExplanationSurface() {
  const { state } = useMenlo()
  const e = state.explanation
  if (!e) return null

  return (
    <section className="animate-surface">
      <div className="mb-5 flex flex-col gap-2">
        <Pill tone="accent" className="w-fit">
          Por trás da decisão
        </Pill>
        <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-[26px]">
          {e.headline}
        </h2>
      </div>

      <ol className="flex flex-col gap-px overflow-hidden rounded-2xl border border-border bg-border">
        {e.factors.map((f, i) => (
          <li key={f.label} className="flex gap-3 bg-card px-4 py-3.5">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary tabular">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{f.label}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{f.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-primary/25 bg-primary/[0.06] px-4 py-3.5">
        <CornerDownRight className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <MonoLabel className="text-primary/80">Conclusão</MonoLabel>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{e.conclusion}</p>
        </div>
      </div>
    </section>
  )
}

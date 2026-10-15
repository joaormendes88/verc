'use client'

import { useMenlo } from '@/lib/menlo/store'
import { MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { formatBRL } from '@/lib/menlo/format'
import { Filter } from 'lucide-react'

// A ranked, drillable customer list — "quem são os 10 maiores / ver clientes".
// When a filter is active ("só Enterprise") it shows a chip so the recorte is
// legible, and it reads its rows from the agent's typed instruction.
export function CustomerTableSurface() {
  const { state } = useMenlo()
  const t = state.customerTable
  if (!t) return null

  return (
    <section className="animate-surface">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-[26px]">
            {t.title}
          </h2>
          <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">{t.note}</p>
        </div>
        {t.filterSegment ? (
          <Pill tone="positive">
            <Filter className="size-3.5" />
            {t.filterSegment}
          </Pill>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-border bg-surface-2 px-4 py-2.5">
          <MonoLabel>#</MonoLabel>
          <MonoLabel>Cliente</MonoLabel>
          <MonoLabel>Valor</MonoLabel>
        </div>
        <ol className="divide-y divide-border">
          {t.rows.map((r, i) => (
            <li key={r.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3">
              <span className="w-5 text-sm tabular text-muted-foreground">{i + 1}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.city} · {r.metricLabel} {r.metric}
                </p>
              </div>
              <span className="text-sm font-semibold tabular">{formatBRL(r.amount)}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

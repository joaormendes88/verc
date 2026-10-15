'use client'

import { useMenlo } from '@/lib/menlo/store'
import { MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

// A side-by-side comparison — channels, scenarios, or previsto vs realizado.
// The winning column is quietly emphasized; the user can act on it via the
// contextual suggestions ("Escolho WhatsApp").
export function ComparisonSurface() {
  const { state } = useMenlo()
  const c = state.comparison
  if (!c) return null

  return (
    <section className="animate-surface">
      <div className="mb-5 flex flex-col gap-2">
        <Pill tone="accent" className="w-fit">
          Comparação
        </Pill>
        <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-[26px]">{c.title}</h2>
        <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">{c.note}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        {/* Header */}
        <div
          className="grid items-center gap-2 border-b border-border bg-surface-2 px-4 py-3"
          style={{ gridTemplateColumns: `1.2fr repeat(${c.columns.length}, 1fr)` }}
        >
          <MonoLabel>Métrica</MonoLabel>
          {c.columns.map((col) => (
            <div key={col.key} className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-sm font-semibold',
                  col.winner ? 'text-primary' : 'text-foreground',
                )}
              >
                {col.label}
              </span>
              {col.winner ? (
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {c.rows.map((row) => (
            <div
              key={row.label}
              className="grid items-center gap-2 px-4 py-3"
              style={{ gridTemplateColumns: `1.2fr repeat(${c.columns.length}, 1fr)` }}
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              {row.values.map((v, i) => (
                <span
                  key={`${row.label}-${c.columns[i]?.key ?? i}`}
                  className={cn(
                    'text-sm tabular',
                    c.columns[i]?.winner
                      ? 'font-semibold text-primary'
                      : row.emphasize
                        ? 'font-medium text-foreground'
                        : 'text-foreground',
                  )}
                >
                  {v}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

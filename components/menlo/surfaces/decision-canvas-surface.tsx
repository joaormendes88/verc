'use client'

import { useState } from 'react'
import { useMenlo } from '@/lib/menlo/store'
import { ActionButton, MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { formatBRLCompact, formatPercent } from '@/lib/menlo/format'
import { cn } from '@/lib/utils'
import { Sparkles, Check } from 'lucide-react'

const RISK_TONE: Record<string, string> = {
  baixo: 'text-primary',
  médio: 'text-foreground',
  alto: 'text-destructive',
}

// The Decision Canvas — a living surface for "onde devo investir R$50k?". Each
// option is weighed on return, risk, confidence and effort so the user can
// select and act directly. Selecting drives the next step (simulate it).
export function DecisionCanvasSurface() {
  const { state, callTool } = useMenlo()
  const c = state.canvas
  const [selected, setSelected] = useState<string | null>(c?.recommendedId ?? null)
  if (!c) return null

  const active = c.options.find((o) => o.id === selected) ?? c.options[0]
  const maxReturn = Math.max(...c.options.map((o) => o.expectedReturn))

  return (
    <section className="animate-surface">
      <div className="mb-5 flex flex-col gap-2">
        <Pill tone="accent" className="w-fit">
          <Sparkles className="size-3.5" />
          Decisão
        </Pill>
        <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-[26px]">{c.question}</h2>
        <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
          Três alocações possíveis, ponderadas por retorno, risco, confiança e esforço. Escolha uma para
          avançar.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {c.options.map((o) => {
          const isActive = o.id === selected
          const isRec = o.id === c.recommendedId
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelected(o.id)}
              className={cn(
                'rounded-2xl border bg-card p-4 text-left transition-all',
                isActive
                  ? 'border-primary shadow-[0_2px_20px_-10px_rgba(0,0,0,0.3)]'
                  : 'border-border hover:border-foreground/20',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex size-5 items-center justify-center rounded-full border',
                      isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                    )}
                  >
                    {isActive ? <Check className="size-3" strokeWidth={3} /> : null}
                  </span>
                  <span className="text-sm font-semibold">{o.label}</span>
                  {isRec ? (
                    <Pill tone="positive" className="px-2 py-0.5">
                      Recomendada
                    </Pill>
                  ) : null}
                </div>
                <span className="text-sm font-semibold tabular text-primary">
                  {formatBRLCompact(o.expectedReturn)}
                </span>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(o.expectedReturn / maxReturn) * 100}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Risco <span className={cn('font-medium', RISK_TONE[o.risk])}>{o.risk}</span>
                </span>
                <span>Confiança {formatPercent(o.confidence, 0)}</span>
                <span>Esforço {o.effort}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{o.detail}</p>
            </button>
          )
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <MonoLabel>Retorno esperado sobre {formatBRLCompact(c.budget)}</MonoLabel>
        <span className="text-sm font-semibold tabular text-primary">
          {formatBRLCompact(active.expectedReturn)}
        </span>
      </div>

      <div className="mt-4">
        <ActionButton variant="primary" onClick={() => void callTool('run_recovery_simulation')}>
          Simular {active.label}
        </ActionButton>
      </div>
    </section>
  )
}

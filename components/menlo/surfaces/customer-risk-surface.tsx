'use client'

import { useMenlo } from '@/lib/menlo/store'
import { ActionButton, Card, Metric, MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { formatBRL, formatBRLCompact, formatNumber, formatPercent } from '@/lib/menlo/format'
import { cn } from '@/lib/utils'
import { AlertTriangle, ArrowRight, Play } from 'lucide-react'

export function CustomerRiskSurface() {
  const { state, callTool } = useMenlo()
  const risk = state.risk
  if (!risk) return null

  return (
    <section className="animate-surface">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Pill tone="accent">Risco por cliente</Pill>
          <MonoLabel>{risk.id}</MonoLabel>
        </div>
        <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-[28px]">
          Clientes em risco de perda
        </h2>
        <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
          {risk.period} · exposição individual ordenada por probabilidade de perda.
        </p>
        {state.shared.filterSegment ? (
          <Pill tone="positive" className="mt-1 w-fit">
            Recorte aplicado · {state.shared.filterSegment}
          </Pill>
        ) : null}
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <Metric label="Exposição total" value={formatBRLCompact(risk.totalExposure)} accent />
          <Metric label="Clientes em risco" value={formatNumber(risk.atRiskCount)} />
          <Metric label="Janela" value={<span className="text-xl">{risk.period}</span>} />
        </div>
        <div className="mt-6 flex items-start gap-2.5 border-t border-border pt-5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <MonoLabel>Principal fator de risco</MonoLabel>
            <p className="mt-1 text-sm font-medium">{risk.topDriver}</p>
          </div>
        </div>
      </Card>

      {/* Per-customer exposure — ranked by risk score. */}
      <div className="mt-4">
        <MonoLabel className="mb-3 block">Clientes prioritários</MonoLabel>
        <div className="flex flex-col gap-2.5">
          {risk.customers.map((c) => (
            <Card key={c.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.name}</span>
                  <MonoLabel>{c.id}</MonoLabel>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {c.city} · {c.driver}
                </p>
              </div>
              <div className="flex items-center gap-5">
                <span className="text-sm font-semibold tabular">{formatBRL(c.amountDue)}</span>
                <div className="flex w-28 flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Risco</span>
                    <span className="tabular">{formatPercent(c.riskScore, 0)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        c.riskScore >= 0.85 ? 'bg-primary' : 'bg-primary/50',
                      )}
                      style={{ width: `${c.riskScore * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-7 flex flex-wrap gap-2.5">
        <ActionButton
          variant="primary"
          icon={<ArrowRight className="size-4" />}
          onClick={() => callTool('identify_recovery_opportunity')}
        >
          Priorizar contato
        </ActionButton>
        <ActionButton icon={<Play className="size-4" />} onClick={() => callTool('run_recovery_simulation')}>
          Simular recuperação
        </ActionButton>
      </div>
    </section>
  )
}

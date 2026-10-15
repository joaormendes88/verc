'use client'

import { useMenlo } from '@/lib/menlo/store'
import { ActionButton, Card, Metric, MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { formatBRL, formatBRLCompact, formatPercent } from '@/lib/menlo/format'
import { Activity, History } from 'lucide-react'

export function AgentPerformanceSurface() {
  const { state, callTool } = useMenlo()
  const p = state.performance
  if (!p) return null

  const maxRecovered = Math.max(...p.breakdown.map((b) => b.recovered))

  return (
    <section className="animate-surface">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Pill tone="accent">
            <Activity className="size-3.5" />
            Desempenho do agente
          </Pill>
          <MonoLabel>{p.id}</MonoLabel>
        </div>
        <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-[28px]">
          {formatBRLCompact(p.totalRecovered)} recuperados em {p.decisions} decisões
        </h2>
        <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
          {p.period} · {formatPercent(p.autonomyRate, 0)} das decisões executadas com aprovação em um clique.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <Metric label="Decisões" value={p.decisions} />
            <Metric label="Campanhas executadas" value={p.campaignsExecuted} />
            <Metric label="Uplift médio" value={<span className="text-primary">{p.avgUplift}</span>} />
            <Metric label="Autonomia" value={formatPercent(p.autonomyRate, 0)} />
          </div>
        </Card>

        <Card className="p-6">
          <MonoLabel>Recuperação por tipo de decisão</MonoLabel>
          <ul className="mt-4 flex flex-col gap-3.5">
            {p.breakdown.map((b) => (
              <li key={b.label}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{b.label}</span>
                  <span className="text-sm font-semibold tabular">{formatBRL(b.recovered)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(b.recovered / maxRecovered) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-7 flex flex-wrap gap-2.5">
        <ActionButton
          variant="primary"
          icon={<History className="size-4" />}
          onClick={() => callTool('show_decision_history')}
        >
          Ver histórico de decisões
        </ActionButton>
      </div>
    </section>
  )
}

'use client'

import { useMenlo } from '@/lib/menlo/store'
import { ActionButton, Card, Metric, MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { formatBRLCompact, formatNumber, formatPercent } from '@/lib/menlo/format'
import { cn } from '@/lib/utils'
import { ArrowRight, MessageCircle, Play, Target } from 'lucide-react'

export function PrioritySegmentSurface() {
  const { state, callTool } = useMenlo()
  const p = state.priority
  if (!p) return null

  const maxRecovery = Math.max(...p.ranking.map((r) => r.expectedRecovery))

  return (
    <section className="animate-surface">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Pill tone="accent">Segmento prioritário</Pill>
          <MonoLabel>{p.id}</MonoLabel>
        </div>
        <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-[28px]">
          Priorize {p.segment} esta semana
        </h2>
        <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
          {p.rationale}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* Chosen segment — the priority workspace leads with the decision. */}
        <Card className="flex flex-col p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Target className="size-3.5" />
            </span>
            <MonoLabel>Prioridade da semana</MonoLabel>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-6">
            <Metric label="Recuperação esperada" value={formatBRLCompact(p.expectedRecovery)} accent />
            <Metric label="Clientes" value={formatNumber(p.customers)} />
            <Metric label="Propensidade média" value={formatPercent(p.propensity, 0)} />
            <div className="flex flex-col gap-1.5">
              <MonoLabel>Melhor canal</MonoLabel>
              <span className="inline-flex w-fit items-center gap-1.5 text-lg font-semibold">
                <MessageCircle className="size-4 text-primary" />
                {p.bestChannel}
              </span>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-primary/25 bg-primary/[0.06] p-4">
            <MonoLabel className="text-primary">Melhor intervenção</MonoLabel>
            <p className="mt-1.5 text-sm font-medium">{p.bestIntervention}</p>
          </div>
        </Card>

        {/* Ranking — why this segment beats the alternatives. */}
        <Card className="p-6">
          <MonoLabel>Ranking de segmentos</MonoLabel>
          <ul className="mt-4 flex flex-col gap-3.5">
            {p.ranking.map((r, i) => (
              <li key={r.name}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className={cn(
                        'flex size-4 items-center justify-center rounded text-[10px] font-semibold tabular',
                        r.recommended
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {i + 1}
                    </span>
                    {r.name}
                  </span>
                  <span className="text-sm font-semibold tabular">
                    {formatBRLCompact(r.expectedRecovery)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', r.recommended ? 'bg-primary' : 'bg-primary/40')}
                    style={{ width: `${(r.expectedRecovery / maxRecovery) * 100}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{formatNumber(r.customers)} clientes</span>
                  <span>Score {formatPercent(r.score, 0)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-7 flex flex-wrap gap-2.5">
        <ActionButton
          variant="primary"
          icon={<ArrowRight className="size-4" />}
          onClick={() => callTool('identify_recovery_opportunity')}
        >
          Ver segmento
        </ActionButton>
        <ActionButton icon={<Play className="size-4" />} onClick={() => callTool('run_recovery_simulation')}>
          Simular estratégia
        </ActionButton>
      </div>
    </section>
  )
}

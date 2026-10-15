'use client'

import { useMenlo } from '@/lib/menlo/store'
import { ActionButton, Card, Metric, MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { formatBRL, formatBRLCompact, formatPercent } from '@/lib/menlo/format'
import { ArrowUpRight, Play, Search, TrendingDown } from 'lucide-react'

export function PaymentLeakageSurface() {
  const { state, callTool } = useMenlo()
  const leak = state.leakage
  if (!leak) return null

  const maxShare = Math.max(...leak.categories.map((c) => c.share))

  return (
    <section className="animate-surface">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Pill tone="accent">Vazamento de pagamentos</Pill>
          <MonoLabel>{leak.id}</MonoLabel>
        </div>
        <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-[28px]">
          Onde estamos perdendo pagamentos
        </h2>
        <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
          {leak.period} · exposição por causa de falha, não por cliente. Comece pela categoria de
          maior perda.
        </p>
      </div>

      {/* Exposure headline — the leakage workspace leads with financial risk. */}
      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <MonoLabel>Exposição total em risco</MonoLabel>
            <div className="text-4xl font-semibold tracking-tight text-primary tabular md:text-5xl">
              {formatBRLCompact(leak.totalAtRisk)}
            </div>
          </div>
          <Pill tone="data" className="gap-1.5">
            <TrendingDown className="size-3.5" />
            {leak.trend}
          </Pill>
        </div>

        {/* Leakage categories — ranked failure causes with proportional bars. */}
        <div className="mt-7 flex flex-col gap-4">
          {leak.categories.map((c) => (
            <div key={c.label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-4">
                <span className="text-sm font-medium">{c.label}</span>
                <span className="text-sm font-semibold tabular">
                  {formatPercent(c.share, 0)}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {formatBRL(c.amount)}
                  </span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(c.share / maxShare) * 100}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{c.cause}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Largest opportunity — the concentration worth attacking first. */}
      <Card className="mt-4 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <MonoLabel>Maior oportunidade</MonoLabel>
          <p className="mt-1.5 text-lg font-semibold">{leak.largest.segment}</p>
          <p className="mt-0.5 max-w-md text-sm text-muted-foreground">{leak.largest.detail}</p>
        </div>
        <Metric label="Recuperável" value={formatBRLCompact(leak.largest.amount)} accent />
      </Card>

      {/* Actions */}
      <div className="mt-7 flex flex-wrap gap-2.5">
        <ActionButton
          variant="primary"
          icon={<Search className="size-4" />}
          onClick={() => callTool('show_customer_risk')}
        >
          Investigar
        </ActionButton>
        <ActionButton icon={<Play className="size-4" />} onClick={() => callTool('run_recovery_simulation')}>
          Simular recuperação
        </ActionButton>
        <ActionButton
          icon={<ArrowUpRight className="size-4" />}
          onClick={() => callTool('identify_recovery_opportunity')}
        >
          Ver oportunidade de recuperação
        </ActionButton>
      </div>
    </section>
  )
}

'use client'

import { useMenlo } from '@/lib/menlo/store'
import { ActionButton, Card, Metric, MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { formatBRL, formatBRLCompact, formatNumber } from '@/lib/menlo/format'
import { ArrowRight, TrendingUp } from 'lucide-react'

export function OutcomeSurface() {
  const { state, callTool } = useMenlo()
  const o = state.outcome
  if (!o) return null

  const conversion = ((o.payments / o.audience) * 100).toFixed(1)

  return (
    <section className="animate-surface">
      <div className="mb-6 flex flex-col gap-2">
        <Pill tone="positive" className="w-fit">
          <TrendingUp className="size-3.5" />
          Resultado financeiro
        </Pill>
        <h2 className="text-2xl font-semibold tracking-tight md:text-[28px]">
          {formatBRL(o.recovered)} recuperados
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          {formatNumber(o.payments)} de {formatNumber(o.audience)} clientes concluíram o pagamento —
          uma conversão de {conversion}%.
        </p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Metric label="Recuperado" value={formatBRLCompact(o.recovered)} accent />
          <Metric label="Pagamentos" value={formatNumber(o.payments)} />
          <Metric label="Tempo médio" value={<span className="text-xl">{o.avgTimeToPayment}</span>} />
          <Metric label="vs. baseline" value={<span className="text-primary">{o.upliftVsBaseline}</span>} />
        </div>
      </Card>

      <div className="mt-7 flex flex-wrap gap-2.5">
        <ActionButton
          variant="primary"
          icon={<ArrowRight className="size-4" />}
          onClick={() => callTool('show_learning')}
        >
          Ver o que o Menlo aprendeu
        </ActionButton>
      </div>
    </section>
  )
}

'use client'

import { useMenlo } from '@/lib/menlo/store'
import { ActionButton, Card, Metric, MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { formatBRLCompact, formatNumber, formatPercent } from '@/lib/menlo/format'
import { cn } from '@/lib/utils'
import { ArrowRight, MessageSquare, TrendingUp } from 'lucide-react'

export function CommunicationSurface() {
  const { state, callTool } = useMenlo()
  const c = state.communication
  if (!c) return null

  const maxShare = Math.max(...c.channels.map((ch) => ch.share))

  return (
    <section className="animate-surface">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Pill tone="positive">
            <MessageSquare className="size-3.5" />
            Atividade de comunicação
          </Pill>
          <MonoLabel>{c.id}</MonoLabel>
        </div>
        <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-[28px]">
          {formatNumber(c.totalMessages)} mensagens respondidas
        </h2>
        <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
          {c.period} · todas respondidas com tempo médio de {c.avgResponseTime}.
        </p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Metric label="Mensagens" value={formatNumber(c.totalMessages)} />
          <Metric label="Respondidas" value={formatPercent(c.responded / c.totalMessages, 0)} />
          <Metric label="Tempo médio" value={<span className="text-xl">{c.avgResponseTime}</span>} />
          <Metric label="Recuperação associada" value={formatBRLCompact(c.linkedRecovery)} accent />
        </div>

        {/* Volume + response quality by channel. */}
        <div className="mt-7 flex flex-col gap-4">
          {c.channels.map((ch) => {
            const best = ch.channel === c.bestChannel
            return (
              <div key={ch.channel}>
                <div className="mb-1.5 flex items-baseline justify-between gap-4">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {ch.channel}
                    {best ? (
                      <Pill tone="positive" className="px-2 py-0.5">
                        Melhor canal
                      </Pill>
                    ) : null}
                  </span>
                  <span className="text-sm font-semibold tabular">
                    {formatNumber(ch.count)}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {formatPercent(ch.responseRate, 0)} resposta
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      best ? 'bg-primary' : 'bg-primary/40',
                    )}
                    style={{ width: `${(ch.share / maxShare) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="mt-7 flex flex-wrap gap-2.5">
        <ActionButton
          variant="primary"
          icon={<TrendingUp className="size-4" />}
          onClick={() => callTool('show_outcome_summary')}
        >
          Ver recuperação associada
        </ActionButton>
        <ActionButton icon={<ArrowRight className="size-4" />} onClick={() => callTool('show_agent_performance')}>
          Ver desempenho
        </ActionButton>
      </div>
    </section>
  )
}

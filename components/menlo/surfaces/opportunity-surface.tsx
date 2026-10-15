'use client'

import { useMenlo } from '@/lib/menlo/store'
import { ActionButton, Card, Metric, MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { SegmentCluster } from '@/components/menlo/ui/segment-cluster'
import { formatBRL, formatBRLCompact, formatNumber, formatPercent } from '@/lib/menlo/format'
import { ArrowRight, Check, MessageCircle, Play, ShieldCheck } from 'lucide-react'

export function OpportunitySurface() {
  const { state, callTool } = useMenlo()
  const opp = state.opportunity
  if (!opp) return null

  return (
    <section className="animate-surface">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Pill tone="accent">Oportunidade de recuperação</Pill>
          <MonoLabel>{opp.id}</MonoLabel>
        </div>
        <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-[28px]">
          {opp.title}
        </h2>
        <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
          {opp.segment}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* Headline metrics + segment map */}
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <Metric
              label="Clientes no segmento"
              value={formatNumber(opp.customerCount)}
              hint={`Ticket médio ${formatBRL(opp.avgTicket)}`}
            />
            <Metric
              label="Recuperação esperada"
              value={formatBRLCompact(opp.expectedRecovery)}
              hint={`${formatPercent(opp.propensity, 0)} de propensidade média`}
              accent
            />
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
            <div>
              <MonoLabel>Janela de contato</MonoLabel>
              <p className="mt-1.5 text-sm font-medium">{opp.window}</p>
            </div>
            <SegmentCluster className="size-24 opacity-80" />
          </div>
        </Card>

        {/* Criteria */}
        <Card className="p-6">
          <MonoLabel>Por que este segmento</MonoLabel>
          <ul className="mt-4 flex flex-col gap-3.5">
            {opp.criteria.map((c) => (
              <li key={c.label} className="flex gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <div>
                  <p className="text-sm font-medium leading-tight">{c.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Sample customers */}
      <div className="mt-4">
        <MonoLabel className="mb-3 block">Amostra do segmento</MonoLabel>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {opp.sample.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => callTool('open_customer_detail', { customerId: c.id })}
              className="group flex flex-col gap-2 bg-card p-4 text-left transition-colors hover:bg-secondary/60"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{c.name}</span>
                <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <span className="text-xs text-muted-foreground">{c.city}</span>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm font-semibold tabular">{formatBRL(c.amountDue)}</span>
                <Pill tone="positive" className="px-2 py-0.5">
                  {formatPercent(c.propensity, 0)}
                </Pill>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-7 flex flex-wrap gap-2.5">
        <ActionButton
          variant="primary"
          icon={<MessageCircle className="size-4" />}
          onClick={() => callTool('preview_whatsapp')}
        >
          Prévia do WhatsApp
        </ActionButton>
        <ActionButton icon={<Play className="size-4" />} onClick={() => callTool('run_recovery_simulation')}>
          Rodar simulação
        </ActionButton>
        <ActionButton icon={<ShieldCheck className="size-4" />} onClick={() => callTool('request_human_approval')}>
          Aprovar
        </ActionButton>
      </div>
    </section>
  )
}

'use client'

import { useMenlo } from '@/lib/menlo/store'
import { ActionButton, Card, Metric, MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { formatBRL, formatPercent } from '@/lib/menlo/format'
import { MessageCircle } from 'lucide-react'

export function CustomerDetailSurface() {
  const { state, callTool } = useMenlo()
  const c = state.selectedCustomer
  if (!c) return null

  return (
    <section className="animate-surface">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Pill tone="data">{c.id}</Pill>
          <Pill tone="positive">{formatPercent(c.propensity, 0)} de propensidade</Pill>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight md:text-[28px]">{c.name}</h2>
        <p className="text-sm text-muted-foreground">{c.city}</p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <Metric label="Valor em aberto" value={formatBRL(c.amountDue)} accent />
          <Metric label="Vencimento" value={<span className="text-base">{c.dueLabel}</span>} />
          <Metric label="Canal preferido" value={<span className="text-base capitalize">{c.channel}</span>} />
        </div>
        <div className="mt-6 border-t border-border pt-5">
          <MonoLabel>Histórico de contato</MonoLabel>
          <p className="mt-1.5 text-sm">{c.lastOutreach}</p>
        </div>
      </Card>

      <div className="mt-7 flex flex-wrap gap-2.5">
        <ActionButton
          variant="primary"
          icon={<MessageCircle className="size-4" />}
          onClick={() => callTool('preview_whatsapp')}
        >
          Prévia do WhatsApp
        </ActionButton>
      </div>
    </section>
  )
}

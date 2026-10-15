'use client'

import { useState } from 'react'
import { useMenlo } from '@/lib/menlo/store'
import { ActionButton, Card, MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { formatBRLCompact, formatNumber } from '@/lib/menlo/format'
import { Pencil, Play, QrCode, ShieldCheck } from 'lucide-react'

export function WhatsappSurface() {
  const { state, callTool } = useMenlo()
  const plan = state.whatsapp
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(plan?.body ?? '')

  if (!plan) return null

  const meta = [
    { label: 'Público', value: formatNumber(plan.audience) },
    { label: 'Canal', value: plan.channel },
    { label: 'Janela', value: plan.window },
    { label: 'Estratégia', value: plan.strategy },
  ]

  return (
    <section className="animate-surface">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Pill tone="positive">Comunicação com o cliente</Pill>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight md:text-[28px]">Prévia do WhatsApp</h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          É exatamente isto que {formatNumber(plan.audience)} clientes vão receber. Ajuste antes de aprovar.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-start">
        {/* The WhatsApp bubble */}
        <div className="rounded-2xl border border-border bg-surface-2 p-5">
          <div className="mx-auto max-w-sm">
            <div className="rounded-2xl rounded-tl-md bg-card p-4 shadow-[0_1px_12px_-6px_rgba(0,0,0,0.25)]">
              <p className="text-[15px] leading-relaxed">{plan.greeting}</p>
              {editing ? (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-lg border border-border bg-background p-2 text-[15px] leading-relaxed outline-none focus:border-primary"
                />
              ) : (
                <p className="mt-2 text-[15px] leading-relaxed">{body}</p>
              )}
              <button
                type="button"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-whatsapp py-2.5 text-sm font-semibold text-whatsapp-foreground"
              >
                <QrCode className="size-4" />
                {plan.cta}
              </button>
            </div>
            <p className="mt-2 pl-1 text-[11px] text-muted-foreground">Prévia — nenhuma mensagem foi enviada</p>
          </div>
        </div>

        {/* Plan meta */}
        <Card className="p-6">
          <MonoLabel>Plano da campanha</MonoLabel>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
            {meta.map((m) => (
              <div key={m.label}>
                <dt className="text-mono-label text-muted-foreground">{m.label}</dt>
                <dd className="mt-1.5 text-sm font-medium">{m.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
            <span className="text-sm text-muted-foreground">Recuperação projetada</span>
            <span className="text-lg font-semibold text-primary tabular">
              {formatBRLCompact(1_470_000)}
            </span>
          </div>
        </Card>
      </div>

      <div className="mt-7 flex flex-wrap gap-2.5">
        <ActionButton icon={<Pencil className="size-4" />} onClick={() => setEditing((v) => !v)}>
          {editing ? 'Concluir edição' : 'Editar'}
        </ActionButton>
        <ActionButton icon={<Play className="size-4" />} onClick={() => callTool('run_recovery_simulation')}>
          Simular
        </ActionButton>
        <ActionButton
          variant="primary"
          icon={<ShieldCheck className="size-4" />}
          onClick={() => callTool('request_human_approval')}
        >
          Aprovar
        </ActionButton>
      </div>
    </section>
  )
}

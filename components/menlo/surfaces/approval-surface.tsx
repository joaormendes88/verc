'use client'

import { useMenlo } from '@/lib/menlo/store'
import { ActionButton, Card, MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { formatBRLCompact, formatNumber } from '@/lib/menlo/format'
import { Play, ShieldCheck } from 'lucide-react'

export function ApprovalSurface() {
  const { state, callTool } = useMenlo()
  const a = state.approval
  if (!a) return null

  const rows = [
    { label: 'Público', value: formatNumber(a.audience) },
    { label: 'Canal', value: a.channel },
    { label: 'Janela', value: a.window },
    { label: 'Recuperação esperada', value: formatBRLCompact(a.expectedRecovery), accent: true },
  ]

  return (
    <section className="animate-surface mx-auto max-w-2xl">
      <div className="mb-6 flex flex-col gap-2">
        <Pill tone="accent" className="w-fit">
          Requer sua aprovação
        </Pill>
        <h2 className="text-2xl font-semibold tracking-tight md:text-[28px]">{a.title}</h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          O Menlo recomenda. A decisão de executar uma ação financeira consequente é sua.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-surface-2 p-5">
          <MonoLabel>Resumo da ação</MonoLabel>
          <p className="mt-2 text-[15px] leading-relaxed">{a.summary}</p>
        </div>
        <dl className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between px-5 py-3.5">
              <dt className="text-sm text-muted-foreground">{r.label}</dt>
              <dd className={r.accent ? 'text-sm font-semibold text-primary tabular' : 'text-sm font-medium'}>
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="mt-7 flex flex-wrap gap-2.5">
        <ActionButton
          variant="primary"
          icon={<ShieldCheck className="size-4" />}
          onClick={() => callTool('execute_campaign')}
        >
          Aprovar e executar
        </ActionButton>
        <ActionButton icon={<Play className="size-4" />} onClick={() => callTool('run_recovery_simulation')}>
          Ajustar cenário
        </ActionButton>
      </div>
    </section>
  )
}

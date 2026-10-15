'use client'

import { useState } from 'react'
import { useMenlo } from '@/lib/menlo/store'
import { ActionButton, Card, Metric, MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { formatBRLCompact, formatNumber, formatPercent } from '@/lib/menlo/format'
import { Check, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SimulationSurface() {
  const { state, callTool, dispatch } = useMenlo()
  const sim = state.simulation
  const [draftConv, setDraftConv] = useState<number | null>(null)
  if (!sim) return null

  const selected = sim.scenarios.find((s) => s.channel === sim.selectedChannel) ?? sim.scenarios[0]
  const maxRecovery = Math.max(...sim.scenarios.map((s) => s.expectedRecovery))
  const conv = draftConv ?? sim.conversion

  return (
    <section className="animate-surface">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Pill tone="accent" className="w-fit">
            Simulação
          </Pill>
          {sim.version > 1 ? <MonoLabel>v{sim.version}</MonoLabel> : null}
        </div>
        <h2 className="text-2xl font-semibold tracking-tight md:text-[28px]">
          Compare os cenários antes de enviar
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Projeção determinística por canal. Escolha a estratégia com a melhor recuperação esperada.
        </p>
      </div>

      {/* Bidirectional shared state: the slider writes the conversion the whole
          decision assumes; the agent ("aumente para 10%") writes the same value.
          Committing recomputes the projection and bumps the version. */}
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between">
          <MonoLabel>Conversão assumida</MonoLabel>
          <span className="text-sm font-semibold tabular text-primary">{formatPercent(conv, 1)}</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          step={0.5}
          value={Math.round(conv * 1000) / 10}
          onChange={(e) => setDraftConv(Number(e.target.value) / 100)}
          onPointerUp={() => {
            if (draftConv !== null) {
              void callTool('adjust_simulation', { conversion: draftConv })
              setDraftConv(null)
            }
          }}
          onKeyUp={() => {
            if (draftConv !== null) {
              void callTool('adjust_simulation', { conversion: draftConv })
              setDraftConv(null)
            }
          }}
          aria-label="Conversão assumida"
          className="mt-3 w-full accent-primary"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Arraste para recalcular a recuperação esperada — ou peça ao Menlo por texto.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        {/* Channel comparison */}
        <div className="flex flex-col gap-2.5">
          {sim.scenarios.map((s) => {
            const active = s.channel === sim.selectedChannel
            return (
              <button
                key={s.channel}
                type="button"
                onClick={() => {
                  dispatch({ type: 'SET_SHARED', patch: { selectedChannel: s.channel } })
                  dispatch({ type: 'SELECT_SCENARIO', channel: s.channel })
                  dispatch({ type: 'SET_ARTIFACT_STATE', artifactType: 'simulation', status: 'modified' })
                }}
                className={cn(
                  'group rounded-2xl border bg-card p-4 text-left transition-all',
                  active ? 'border-primary shadow-[0_2px_20px_-10px_rgba(0,0,0,0.3)]' : 'border-border hover:border-foreground/20',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'flex size-5 items-center justify-center rounded-full border',
                        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                      )}
                    >
                      {active ? <Check className="size-3" strokeWidth={3} /> : null}
                    </span>
                    <span className="text-sm font-semibold">{s.label}</span>
                    {s.recommended ? <Pill tone="positive" className="px-2 py-0.5">Recomendado</Pill> : null}
                  </div>
                  <span className="text-sm font-semibold text-primary tabular">
                    {formatBRLCompact(s.expectedRecovery)}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(s.expectedRecovery / maxRecovery) * 100}%` }}
                  />
                </div>
                <div className="mt-3 flex gap-5 text-xs text-muted-foreground">
                  <span>{formatNumber(s.expectedPayments)} pagamentos</span>
                  <span>Entrega {formatPercent(s.deliveryRate, 1)}</span>
                  <span>Clique {formatPercent(s.clickRate, 1)}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected scenario detail */}
        <Card className="p-6">
          <MonoLabel>Cenário selecionado</MonoLabel>
          <p className="mt-1 text-lg font-semibold">{selected.label}</p>
          <div className="mt-5 grid grid-cols-2 gap-5">
            <Metric label="Pagamentos esperados" value={formatNumber(selected.expectedPayments)} />
            <Metric label="Recuperação" value={formatBRLCompact(selected.expectedRecovery)} accent />
            <Metric label="Entrega prevista" value={formatPercent(selected.deliveryRate, 1)} />
            <Metric label="Clique previsto" value={formatPercent(selected.clickRate, 1)} />
          </div>
        </Card>
      </div>

      <div className="mt-7 flex flex-wrap gap-2.5">
        <ActionButton
          variant="primary"
          icon={<ShieldCheck className="size-4" />}
          onClick={() => callTool('request_human_approval')}
        >
          Aprovar {selected.label}
        </ActionButton>
      </div>
    </section>
  )
}

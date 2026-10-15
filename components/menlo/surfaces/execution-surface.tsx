'use client'

import { useEffect } from 'react'
import { useMenlo } from '@/lib/menlo/store'
import { Card, Metric, MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { formatBRLCompact, formatNumber } from '@/lib/menlo/format'
import { SIMULATION_RESULT } from '@/lib/menlo/data'

export function ExecutionSurface() {
  const { state, dispatch, callTool } = useMenlo()
  const exec = state.execution

  const scenario =
    state.simulation?.scenarios.find((s) => s.channel === state.simulation?.selectedChannel) ??
    SIMULATION_RESULT.scenarios[0]
  const targetPayments = scenario.expectedPayments
  const targetRecovery = scenario.expectedRecovery
  const total = exec?.total ?? 2431

  useEffect(() => {
    // If this campaign already produced an outcome, the artifact is being
    // re-expanded from the thread's memory — render the final state, don't
    // re-run the animation or append a duplicate outcome.
    if (state.outcome) return

    // Strict Mode mounts effects twice: the first interval is cleared on
    // cleanup and the second runs to completion. No mount guard here — a
    // guard would let cleanup kill the only surviving interval.
    const ticks = 36
    let i = 0
    let done = false
    const timer = setInterval(() => {
      i++
      const progress = i / ticks
      const eased = 1 - Math.pow(1 - progress, 2)
      dispatch({
        type: 'UPDATE_EXECUTION',
        patch: {
          completed: Math.round(eased * targetPayments),
          recovered: Math.round(eased * targetRecovery),
          avgTimeToPayment: i > 8 ? '38 min' : '—',
          running: i < ticks,
        },
      })
      if (i >= ticks && !done) {
        done = true
        clearInterval(timer)
        setTimeout(() => callTool('show_financial_outcome'), 900)
      }
    }, 130)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!exec) return null
  const pct = Math.min(100, (exec.completed / targetPayments) * 100)

  return (
    <section className="animate-surface">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Pill tone="positive">
            <span className={exec.running ? 'size-1.5 rounded-full bg-primary animate-pulse-dot' : 'size-1.5 rounded-full bg-primary'} />
            {exec.running ? 'Executando' : 'Concluído'}
          </Pill>
          <MonoLabel>Campanha de recuperação</MonoLabel>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight md:text-[28px]">
          {exec.running ? 'Recuperação em andamento' : 'Campanha concluída'}
        </h2>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Metric
            label="Pagamentos"
            value={
              <span className="tabular">
                {formatNumber(exec.completed)}
                <span className="text-lg text-muted-foreground"> / {formatNumber(total)}</span>
              </span>
            }
          />
          <Metric label="Recuperado" value={formatBRLCompact(exec.recovered)} accent />
          <Metric label="Tempo médio ao pagamento" value={<span className="text-xl">{exec.avgTimeToPayment}</span>} />
          <Metric label="vs. baseline" value={<span className="text-primary">{exec.upliftVsBaseline}</span>} />
        </div>

        <div className="mt-7">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span className="tabular">{pct.toFixed(0)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </Card>
    </section>
  )
}

'use client'

import { useMenlo } from '@/lib/menlo/store'
import { STAGE_FOR_ARTIFACT } from '@/lib/menlo/artifacts'
import { cn } from '@/lib/utils'

const STAGES = ['Entender', 'Oportunidade', 'Comunicação', 'Simulação', 'Aprovação', 'Execução', 'Resultado']

export function Journey() {
  const { state } = useMenlo()

  // The stepper reflects the furthest point reached across all artifacts in
  // the thread — the decision funnel as operational memory, not a single page.
  let current = -1
  for (const item of state.timeline) {
    if (item.kind === 'artifact') {
      const stage = STAGE_FOR_ARTIFACT[item.artifact.type]
      if (stage > current) current = stage
    }
  }
  if (current < 0) return null

  return (
    <nav aria-label="Etapa da decisão" className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
      {STAGES.map((stage, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={stage} className="flex items-center gap-1.5">
            <span
              className={cn(
                'text-[11px] font-medium transition-colors',
                active ? 'text-foreground' : done ? 'text-muted-foreground' : 'text-muted-foreground/45',
              )}
            >
              {stage}
            </span>
            {i < STAGES.length - 1 ? (
              <span className={cn('h-px w-4', done ? 'bg-primary/50' : 'bg-border')} />
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}

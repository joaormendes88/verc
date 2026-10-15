'use client'

import { useMenlo } from '@/lib/menlo/store'
import { ActionButton, Card, MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { RotateCcw, Sparkles } from 'lucide-react'

export function LearningSurface() {
  const { state, callTool } = useMenlo()
  const l = state.learning
  if (!l) return null

  return (
    <section className="animate-surface mx-auto max-w-2xl">
      <div className="mb-6 flex flex-col gap-2">
        <Pill tone="accent" className="w-fit">
          <Sparkles className="size-3.5" />
          Aprendizado
        </Pill>
        <h2 className="text-2xl font-semibold tracking-tight md:text-[28px]">
          O que o Menlo aprendeu
        </h2>
      </div>

      <div className="flex flex-col gap-2.5">
        {l.insights.map((ins, i) => (
          <Card key={i} className="p-5 animate-rise" >
            <p className="text-[15px] font-medium leading-snug">{ins.headline}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{ins.detail}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/[0.06] p-5">
        <MonoLabel className="text-primary">Próximo passo</MonoLabel>
        <p className="mt-2 text-[15px] leading-relaxed">{l.nextAction}</p>
      </div>

      <div className="mt-7 flex flex-wrap gap-2.5">
        <ActionButton
          variant="primary"
          icon={<RotateCcw className="size-4" />}
          onClick={() => callTool('reset_workspace')}
        >
          Nova decisão
        </ActionButton>
      </div>
    </section>
  )
}

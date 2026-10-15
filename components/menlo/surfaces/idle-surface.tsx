'use client'

import { useMenlo } from '@/lib/menlo/store'
import { MonoLabel } from '@/components/menlo/ui/primitives'
import { ArrowRight } from 'lucide-react'

const SUGGESTIONS = [
  'Quem devemos contatar amanhã para maximizar a recuperação?',
  'Onde estamos perdendo pagamentos esta semana?',
  'Qual segmento devemos priorizar esta semana?',
]

export function IdleSurface() {
  const { runAgent } = useMenlo()

  return (
    <section className="animate-surface flex min-h-[52vh] flex-col justify-center">
      <MonoLabel className="mb-4">Ambiente de decisão financeira</MonoLabel>
      <h1 className="max-w-2xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl">
        Faça uma pergunta financeira.
        <br />
        <span className="text-muted-foreground">O Menlo monta o workspace certo.</span>
      </h1>
      <p className="mt-5 max-w-lg text-pretty text-[15px] leading-relaxed text-muted-foreground">
        O Menlo não é um chatbot com dashboard. Cada decisão financeira ganha seu próprio espaço, que
        se organiza em torno do problema que você trouxe.
      </p>

      <div className="mt-10 flex flex-col gap-px overflow-hidden rounded-2xl border border-border bg-border">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => runAgent(s)}
            className="group flex items-center justify-between gap-4 bg-card px-5 py-4 text-left transition-colors hover:bg-secondary/60"
          >
            <span className="text-[15px] font-medium">{s}</span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </button>
        ))}
      </div>
    </section>
  )
}

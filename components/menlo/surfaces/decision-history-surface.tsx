'use client'

import { useMenlo } from '@/lib/menlo/store'
import { ActionButton, MonoLabel, Pill } from '@/components/menlo/ui/primitives'
import { History, RotateCcw, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// Operational memory: not just what was generated, but what happened and why.
// Each event records the actor, the action, and the detail — and the whole
// session can be stepped back with undo.
export function DecisionHistorySurface() {
  const { state, runAgent } = useMenlo()
  const events = state.events

  return (
    <section className="animate-surface">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Pill tone="accent" className="w-fit">
            <History className="size-3.5" />
            Histórico de decisões
          </Pill>
          <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-[28px]">
            A memória desta sessão
          </h2>
          <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
            {events.length} eventos registrados — o que foi perguntado, o que o Menlo fez e por quê.
          </p>
        </div>
        {state.past.length > 0 ? (
          <ActionButton icon={<RotateCcw className="size-4" />} onClick={() => runAgent('Desfaça a última alteração')}>
            Desfazer última
          </ActionButton>
        ) : null}
      </div>

      <ol className="relative flex flex-col gap-2.5 border-l border-border pl-5">
        {events.map((e) => {
          const isUser = e.actor === 'user'
          return (
            <li key={e.id} className="relative">
              <span
                aria-hidden
                className={cn(
                  'absolute -left-[1.5625rem] top-3 size-2 rounded-full ring-4 ring-background',
                  isUser ? 'bg-muted-foreground/40' : 'bg-primary/70',
                )}
              />
              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2">
                  {isUser ? (
                    <User className="size-3.5 text-muted-foreground" />
                  ) : (
                    <span className="flex size-3.5 items-center justify-center rounded-[3px] bg-primary text-primary-foreground">
                      <span className="size-1.5 rounded-[1px] bg-primary-foreground" />
                    </span>
                  )}
                  <span className="text-sm font-medium">{e.action}</span>
                  <MonoLabel className="ml-auto">{isUser ? 'você' : 'menlo'}</MonoLabel>
                </div>
                {e.detail ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{e.detail}</p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

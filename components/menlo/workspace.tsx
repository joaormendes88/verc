'use client'

import { useMenlo } from '@/lib/menlo/store'
import { Journey } from './journey'
import { Thread } from './thread/thread'
import { IdleSurface } from './surfaces/idle-surface'
import { Composer } from './composer'
import { RotateCcw } from 'lucide-react'

export function Workspace() {
  const { state, callTool } = useMenlo()
  const started = state.timeline.length > 0

  return (
    <div className="flex h-dvh flex-col">
      {/* Header — minimal chrome */}
      <header className="sticky top-0 z-10 shrink-0 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="size-2 rounded-[3px] bg-primary-foreground" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Menlo</span>
            <span className="text-mono-label text-muted-foreground">Finance</span>
          </div>
          <div className="hidden md:block">
            <Journey />
          </div>
          {started ? (
            <button
              type="button"
              onClick={() => callTool('reset_workspace')}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              Reiniciar
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">Dados simulados</span>
          )}
        </div>
        {started ? (
          <div className="border-t border-border/70 px-5 py-2.5 md:hidden">
            <Journey />
          </div>
        ) : null}
      </header>

      {/* Thread — the persistent product surface. Falls back to an elegant
          idle hero before the first question. */}
      <main className="flex-1 overflow-y-auto px-5">
        {started ? (
          <Thread />
        ) : (
          <div className="mx-auto w-full max-w-3xl">
            <IdleSurface />
          </div>
        )}
      </main>

      {/* Composer — always available; the conversation never leaves this view. */}
      <div className="sticky bottom-0 z-10 shrink-0 border-t border-border/70 bg-background/85 px-5 py-4 backdrop-blur-md">
        <Composer />
      </div>
    </div>
  )
}

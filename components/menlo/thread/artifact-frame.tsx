'use client'

import { useEffect, useRef, useState } from 'react'
import { useMenlo } from '@/lib/menlo/store'
import type { ThreadArtifact } from '@/lib/menlo/types'
import { ARTIFACT_LABEL, ARTIFACT_STATE_LABEL, artifactSummary } from '@/lib/menlo/artifacts'
import { ArtifactView } from './artifact-view'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

// A generated financial surface, living inside the thread. Older artifacts
// compress to a single line (operational memory) while the current one stays
// open. Artifacts are never destroyed — the whole decision journey persists.
export function ArtifactFrame({
  artifact,
  isLatest,
}: {
  artifact: ThreadArtifact
  isLatest: boolean
}) {
  const { state } = useMenlo()
  const [open, setOpen] = useState(isLatest)
  const ref = useRef<HTMLDivElement>(null)

  const highlighted = state.highlightId === artifact.id

  // When a newer artifact arrives, gracefully compress this one.
  useEffect(() => {
    if (!isLatest) setOpen(false)
  }, [isLatest])

  // A follow-up that references this artifact re-opens and scrolls to it.
  useEffect(() => {
    if (highlighted) {
      setOpen(true)
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlighted])

  const running = artifact.status === 'executing'

  return (
    <div
      ref={ref}
      className={cn(
        'animate-rise overflow-hidden rounded-3xl border bg-surface-2 transition-all duration-300',
        highlighted ? 'border-primary ring-2 ring-primary/25' : 'border-border',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/40 md:px-5"
      >
        <span
          aria-hidden
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            running ? 'bg-primary animate-pulse-dot' : 'bg-primary/60',
          )}
        />
        <span className="text-mono-label text-muted-foreground">{ARTIFACT_LABEL[artifact.type]}</span>
        <span className="ml-1 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {ARTIFACT_STATE_LABEL[artifact.status]}
        </span>
        <span className="ml-auto flex items-center gap-3">
          {!open ? (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {artifactSummary(artifact.type, state)}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              'size-4 text-muted-foreground transition-transform duration-200',
              open ? 'rotate-180' : 'rotate-0',
            )}
          />
        </span>
      </button>

      {open ? (
        <div className="border-t border-border/70 bg-background px-4 py-5 md:px-6 md:py-6">
          <ArtifactView type={artifact.type} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full border-t border-border/70 bg-background px-4 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground sm:hidden md:px-6"
        >
          {artifactSummary(artifact.type, state)}
        </button>
      )}
    </div>
  )
}

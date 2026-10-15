'use client'

import { useEffect, useRef } from 'react'
import { useMenlo } from '@/lib/menlo/store'
import { MessageRow } from './message-row'
import { ArtifactFrame } from './artifact-frame'
import { AgentStatus } from './agent-status'

// The thread is the product surface: messages and generated financial
// artifacts interleaved in one continuous, persistent conversation.
export function Thread() {
  const { state } = useMenlo()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Find the newest artifact so only it stays expanded by default.
  let lastArtifactId: string | null = null
  for (let i = state.timeline.length - 1; i >= 0; i--) {
    const item = state.timeline[i]
    if (item.kind === 'artifact') {
      lastArtifactId = item.artifact.id
      break
    }
  }

  // Keep the latest activity in view as the conversation grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [state.timeline.length, state.agentStatus, state.thinking])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-6 pt-8">
      {state.timeline.map((item) =>
        item.kind === 'message' ? (
          <MessageRow key={item.id} message={item.message} />
        ) : (
          <ArtifactFrame
            key={item.id}
            artifact={item.artifact}
            isLatest={item.artifact.id === lastArtifactId}
          />
        ),
      )}

      {state.thinking && state.agentStatus ? <AgentStatus status={state.agentStatus} /> : null}

      <div ref={bottomRef} />
    </div>
  )
}

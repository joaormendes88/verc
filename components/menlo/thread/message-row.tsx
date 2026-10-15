'use client'

import type { ThreadMessage } from '@/lib/menlo/types'
import { cn } from '@/lib/utils'

// The conversation is connective tissue: user messages read as quiet prompts,
// Menlo's replies as a calm operator voice. Neither competes with the
// generated financial artifacts, which are meant to dominate.
export function MessageRow({ message }: { message: ThreadMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex animate-rise justify-end">
        <p className="max-w-[85%] text-pretty rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-[15px] leading-relaxed text-secondary-foreground">
          {message.content}
        </p>
      </div>
    )
  }

  return (
    <div className="flex animate-rise items-start gap-3">
      <span
        aria-hidden
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
      >
        <span className="size-2 rounded-[3px] bg-primary-foreground" />
      </span>
      <p className={cn('max-w-[85%] text-pretty pt-0.5 text-[15px] leading-relaxed text-foreground')}>
        {message.content}
      </p>
    </div>
  )
}

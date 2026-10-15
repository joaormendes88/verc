'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function Pill({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'positive' | 'accent' | 'data'
  className?: string
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-secondary text-secondary-foreground',
    positive: 'bg-primary/10 text-primary',
    accent: 'bg-accent/25 text-accent-foreground',
    data: 'bg-foreground/[0.06] text-muted-foreground',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('text-mono-label text-muted-foreground', className)}>{children}</span>
}

export function Metric({
  label,
  value,
  hint,
  accent,
  className,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  accent?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <MonoLabel>{label}</MonoLabel>
      <div
        className={cn(
          'text-2xl font-semibold tracking-tight tabular',
          accent ? 'text-primary' : 'text-foreground',
        )}
      >
        {value}
      </div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  )
}

export function ActionButton({
  children,
  onClick,
  variant = 'ghost',
  icon,
  className,
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'quiet'
  icon?: ReactNode
  className?: string
  disabled?: boolean
}) {
  const variants: Record<string, string> = {
    primary:
      'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20',
    ghost:
      'bg-card text-foreground border border-border hover:border-foreground/25 hover:bg-secondary/60',
    quiet: 'text-muted-foreground hover:text-foreground',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

export function SurfaceShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  className,
}: {
  eyebrow?: ReactNode
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <section className={cn('animate-surface', className)}>
      {(eyebrow || title || description) && (
        <header className="mb-6 flex flex-col gap-2">
          {eyebrow ? <div className="flex items-center gap-2">{eyebrow}</div> : null}
          {title ? (
            <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-[28px]">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </header>
      )}
      {children}
      {footer ? <div className="mt-7">{footer}</div> : null}
    </section>
  )
}

export function Card({
  children,
  className,
  interactive,
  onClick,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-border bg-card',
        interactive &&
          'cursor-pointer transition-all duration-200 hover:border-foreground/20 hover:shadow-[0_2px_20px_-8px_rgba(0,0,0,0.15)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

'use client'

// A load-bearing segment map: each dot is a slice of the recovery segment,
// radius ~ expected value, opacity ~ payment propensity. Deterministic layout.

const DOTS: { x: number; y: number; r: number; p: number }[] = [
  { x: 50, y: 50, r: 26, p: 0.95 },
  { x: 24, y: 38, r: 15, p: 0.82 },
  { x: 78, y: 40, r: 17, p: 0.88 },
  { x: 33, y: 72, r: 12, p: 0.7 },
  { x: 68, y: 74, r: 14, p: 0.78 },
  { x: 50, y: 20, r: 10, p: 0.66 },
  { x: 14, y: 62, r: 8, p: 0.55 },
  { x: 88, y: 66, r: 9, p: 0.6 },
  { x: 50, y: 84, r: 8, p: 0.5 },
  { x: 20, y: 84, r: 6, p: 0.45 },
  { x: 84, y: 22, r: 7, p: 0.52 },
  { x: 63, y: 33, r: 6, p: 0.58 },
]

export function SegmentCluster({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Mapa do segmento de recuperação">
      {DOTS.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          className="fill-primary animate-fade"
          style={{ opacity: 0.14 + d.p * 0.5, animationDelay: `${i * 45}ms` }}
        />
      ))}
    </svg>
  )
}

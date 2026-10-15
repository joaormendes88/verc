// Brazilian financial formatting (BRL, pt-BR conventions).

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatBRLCompact(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `R$${millions.toFixed(millions >= 10 ? 1 : 2)}M`
  }
  if (value >= 1_000) {
    return `R$${Math.round(value / 1000)}K`
  }
  return `R$${value}`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatPercent(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`
}

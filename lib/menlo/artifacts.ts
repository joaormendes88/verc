import type { ArtifactState, ArtifactType, MenloState } from './types'
import { formatBRLCompact, formatNumber } from './format'

// Human label for each artifact type — used in the frame header and when an
// artifact is collapsed into the thread's operational memory.
export const ARTIFACT_LABEL: Record<ArtifactType, string> = {
  opportunity: 'Oportunidade de recuperação',
  'payment-leakage': 'Vazamento de pagamentos',
  'segment-priority': 'Segmento prioritário',
  'customer-risk': 'Risco por cliente',
  'customer-detail': 'Detalhe do cliente',
  whatsapp: 'Prévia do WhatsApp',
  simulation: 'Simulação de estratégia',
  approval: 'Aprovação',
  execution: 'Execução',
  outcome: 'Resultado financeiro',
  learning: 'Aprendizado',
  communication: 'Atividade de comunicação',
  'agent-performance': 'Desempenho do agente',
  'decision-history': 'Histórico de decisões',
  metric: 'Resposta direta',
  comparison: 'Comparação',
  explanation: 'Explicação da decisão',
  'customer-table': 'Clientes',
  'decision-canvas': 'Decisão',
}

// pt-BR label for each subtle lifecycle state shown as a small chip.
export const ARTIFACT_STATE_LABEL: Record<ArtifactState, string> = {
  analyzing: 'Analisando',
  ready: 'Pronto',
  interacting: 'Em interação',
  modified: 'Ajustado',
  approved: 'Aprovado',
  executing: 'Executando',
  completed: 'Concluído',
  learned: 'Aprendido',
}

// Position of each artifact in the recovery decision funnel. -1 means the
// artifact is not part of the funnel (e.g. communication, performance).
export const STAGE_FOR_ARTIFACT: Record<ArtifactType, number> = {
  opportunity: 1,
  'payment-leakage': 1,
  'segment-priority': 1,
  'customer-risk': 1,
  'customer-detail': 1,
  whatsapp: 2,
  simulation: 3,
  approval: 4,
  execution: 5,
  outcome: 6,
  learning: 6,
  communication: -1,
  'agent-performance': -1,
  'decision-history': -1,
  metric: -1,
  comparison: 3,
  explanation: -1,
  'customer-table': 1,
  'decision-canvas': 1,
}

// A one-line summary used when an artifact is collapsed. Reads live state so
// the compressed memory still shows the number that mattered.
export function artifactSummary(type: ArtifactType, state: MenloState): string {
  switch (type) {
    case 'opportunity':
      return state.opportunity
        ? `${formatNumber(state.opportunity.customerCount)} clientes · ${formatBRLCompact(state.opportunity.expectedRecovery)}`
        : '—'
    case 'payment-leakage':
      return state.leakage ? `${formatBRLCompact(state.leakage.totalAtRisk)} em risco` : '—'
    case 'segment-priority':
      return state.priority
        ? `${state.priority.segment} · ${formatBRLCompact(state.priority.expectedRecovery)}`
        : '—'
    case 'customer-risk':
      return state.risk
        ? `${formatNumber(state.risk.atRiskCount)} clientes · ${formatBRLCompact(state.risk.totalExposure)}`
        : '—'
    case 'customer-detail':
      return state.selectedCustomer ? state.selectedCustomer.name : '—'
    case 'whatsapp':
      return state.whatsapp ? `${formatNumber(state.whatsapp.audience)} clientes` : '—'
    case 'simulation': {
      const sim = state.simulation
      if (!sim) return '—'
      const sel = sim.scenarios.find((s) => s.channel === sim.selectedChannel) ?? sim.scenarios[0]
      return `${sel.label} · ${formatBRLCompact(sel.expectedRecovery)}`
    }
    case 'approval':
      return state.approval ? `${state.approval.channel} · ${formatBRLCompact(state.approval.expectedRecovery)}` : '—'
    case 'execution':
      return state.execution ? `${formatBRLCompact(state.execution.recovered)} recuperados` : '—'
    case 'outcome':
      return state.outcome ? `${formatBRLCompact(state.outcome.recovered)} recuperados` : '—'
    case 'learning':
      return state.learning ? `${state.learning.insights.length} aprendizados` : '—'
    case 'communication':
      return state.communication ? `${formatNumber(state.communication.totalMessages)} mensagens` : '—'
    case 'agent-performance':
      return state.performance ? `${formatBRLCompact(state.performance.totalRecovered)} recuperados` : '—'
    case 'decision-history':
      return 'Memória da sessão'
    case 'metric':
      return state.metric ? `${state.metric.label} · ${state.metric.value}` : '—'
    case 'comparison':
      return state.comparison ? state.comparison.title : '—'
    case 'explanation':
      return state.explanation ? state.explanation.headline : '—'
    case 'customer-table':
      return state.customerTable
        ? `${state.customerTable.rows.length} clientes${state.customerTable.filterSegment ? ` · ${state.customerTable.filterSegment}` : ''}`
        : '—'
    case 'decision-canvas':
      return state.canvas ? state.canvas.question : '—'
    default:
      return '—'
  }
}

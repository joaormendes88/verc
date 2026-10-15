import type { ArtifactState, ChannelId, FinancialIntent } from './types'

// ---------------------------------------------------------------------------
// Deterministic local financial intent router.
//
// This is NOT an LLM. It is a transparent, rule-based classifier that maps a
// natural-language financial question to a FinancialIntent. The agent layer
// (store.runAgent) uses the result to choose which semantic frontend capability
// to invoke — which in turn composes the right financial workspace.
//
// When a real backend arrives, this module is the single seam to replace: swap
// `classifyIntent` for a model/tool call and everything downstream is unchanged.
// ---------------------------------------------------------------------------

interface IntentRule {
  intent: FinancialIntent
  // Weighted keyword signals. Accent-insensitive substring match after
  // normalization. Higher weight = stronger signal for that intent.
  signals: { term: string; weight: number }[]
}

// Order also acts as the deterministic tie-breaker (earlier wins on equal score).
const RULES: IntentRule[] = [
  {
    intent: 'PAYMENT_LEAKAGE',
    signals: [
      { term: 'perdendo', weight: 3 },
      { term: 'perda', weight: 3 },
      { term: 'perdas', weight: 3 },
      { term: 'perdemos', weight: 3 },
      { term: 'vazamento', weight: 3 },
      { term: 'vazando', weight: 3 },
      { term: 'onde estamos', weight: 2 },
      { term: 'falha', weight: 2 },
      { term: 'falhando', weight: 2 },
      { term: 'leak', weight: 3 },
      { term: 'losing', weight: 3 },
      { term: 'churn de pagamento', weight: 2 },
    ],
  },
  {
    intent: 'SEGMENT_PRIORITY',
    signals: [
      { term: 'segmento', weight: 3 },
      { term: 'segmentos', weight: 3 },
      { term: 'priorizar', weight: 3 },
      { term: 'prioridade', weight: 3 },
      { term: 'priorizamos', weight: 3 },
      { term: 'foco', weight: 2 },
      { term: 'focar', weight: 2 },
      { term: 'segment', weight: 3 },
      { term: 'priority', weight: 3 },
      { term: 'prioritize', weight: 3 },
    ],
  },
  {
    intent: 'CUSTOMER_RISK',
    signals: [
      { term: 'risco', weight: 3 },
      { term: 'em risco', weight: 3 },
      { term: 'inadimpl', weight: 3 },
      { term: 'inadimplente', weight: 3 },
      { term: 'churn', weight: 2 },
      { term: 'risk', weight: 3 },
      { term: 'default', weight: 2 },
      { term: 'delinqu', weight: 2 },
    ],
  },
  {
    intent: 'RECOVERY_OPPORTUNITY',
    signals: [
      { term: 'contatar', weight: 3 },
      { term: 'contato', weight: 2 },
      { term: 'quem devemos', weight: 3 },
      { term: 'maximizar', weight: 2 },
      { term: 'recuperar', weight: 2 },
      { term: 'recuperacao', weight: 2 },
      { term: 'recuperação', weight: 2 },
      { term: 'cobrar', weight: 2 },
      { term: 'contact', weight: 3 },
      { term: 'recovery', weight: 2 },
      { term: 'maximize', weight: 2 },
    ],
  },
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .trim()
}

export interface IntentMatch {
  intent: FinancialIntent
  score: number
  matched: string[]
}

/**
 * Classify a financial question into a FinancialIntent using deterministic
 * weighted keyword matching. Returns UNKNOWN when no signal is found.
 */
export function classifyIntent(text: string): IntentMatch {
  const q = normalize(text)
  let best: IntentMatch = { intent: 'UNKNOWN', score: 0, matched: [] }

  for (const rule of RULES) {
    let score = 0
    const matched: string[] = []
    for (const signal of rule.signals) {
      if (q.includes(normalize(signal.term))) {
        score += signal.weight
        matched.push(signal.term)
      }
    }
    // Strictly greater keeps the earliest rule on ties (deterministic).
    if (score > best.score) {
      best = { intent: rule.intent, score, matched }
    }
  }

  return best
}

// ---------------------------------------------------------------------------
// Conversational planner.
//
// The thread is a continuous conversation, so a message is not always a brand
// new financial question. It can be a follow-up that operates on the artifacts
// already in the thread ("escolha WhatsApp", "aprovar", "por que Enterprise?").
//
// planResponse turns any message into a single response plan: what Menlo says,
// the subtle status it shows while working, and which semantic tool it invokes.
// It reads shared conversation context so the user never has to repeat a choice.
// Like classifyIntent, this is the deterministic seam a real model would replace.
// ---------------------------------------------------------------------------

export interface PlannerContext {
  hasSimulation: boolean
  hasApproval: boolean
  hasCommunication: boolean
  hasPriority: boolean
  selectedSegment: string | null
}

export interface ResponsePlan {
  // The message Menlo adds to the thread (its answer / narration).
  narration: string
  // Ordered, extremely subtle status lines shown while composing.
  steps: string[]
  // The semantic frontend tool to invoke (appends or mutates an artifact).
  tool: string | null
  args?: Record<string, unknown>
  // When the plan mutates an existing artifact, the new state to reflect.
  mutateState?: ArtifactState
  intent: FinancialIntent | null
}

// Narration + status + tool for each brand-new financial workspace question.
const WORKSPACE_PLAN: Record<FinancialIntent, ResponsePlan> = {
  RECOVERY_OPPORTUNITY: {
    narration: 'Encontrei uma oportunidade de recuperação de alta confiança para amanhã.',
    steps: ['Entendendo sua pergunta', 'Analisando propensidade em 48.210 clientes', 'Compondo resposta'],
    tool: 'identify_recovery_opportunity',
    intent: 'RECOVERY_OPPORTUNITY',
  },
  PAYMENT_LEAKAGE: {
    narration: 'Mapeei onde os pagamentos estão vazando esta semana e a exposição total.',
    steps: ['Entendendo sua pergunta', 'Rastreando falhas de pagamento', 'Quantificando a exposição'],
    tool: 'show_payment_leakage',
    intent: 'PAYMENT_LEAKAGE',
  },
  SEGMENT_PRIORITY: {
    narration: 'Ranqueei os segmentos por recuperação esperada e escolhi a prioridade da semana.',
    steps: ['Entendendo sua pergunta', 'Comparando segmentos', 'Compondo resposta'],
    tool: 'show_priority_segment',
    intent: 'SEGMENT_PRIORITY',
  },
  CUSTOMER_RISK: {
    narration: 'Avaliei o risco por cliente e priorizei onde intervir primeiro.',
    steps: ['Entendendo sua pergunta', 'Avaliando risco por cliente', 'Priorizando intervenções'],
    tool: 'show_customer_risk',
    intent: 'CUSTOMER_RISK',
  },
  COMMUNICATION_ACTIVITY: {
    narration: 'Hoje respondi 1.284 mensagens. Veja a atividade por canal.',
    steps: ['Consultando atividade', 'Compondo resposta'],
    tool: 'show_communication_activity',
    intent: 'COMMUNICATION_ACTIVITY',
  },
  AGENT_PERFORMANCE: {
    narration: 'Aqui está meu desempenho recente como operador financeiro.',
    steps: ['Reunindo métricas', 'Compondo painel'],
    tool: 'show_agent_performance',
    intent: 'AGENT_PERFORMANCE',
  },
  OUTCOME_SUMMARY: {
    narration: 'Essas interações estiveram associadas a R$1,47M em recuperação.',
    steps: ['Cruzando com pagamentos', 'Compondo resultado'],
    tool: 'show_outcome_summary',
    intent: 'OUTCOME_SUMMARY',
  },
  DECISION_HISTORY: {
    narration: 'Aqui está a linha do tempo das decisões desta sessão.',
    steps: ['Revisando a memória da sessão'],
    tool: 'show_decision_history',
    intent: 'DECISION_HISTORY',
  },
  UNKNOWN: {
    narration: 'Vou compor um ponto de partida com as prioridades da semana.',
    steps: ['Entendendo sua pergunta', 'Procurando o ângulo mais útil', 'Compondo resposta'],
    tool: 'compose_generic_workspace',
    intent: 'UNKNOWN',
  },
}

const CHANNEL_LABEL: Record<Exclude<ChannelId, 'none'>, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'E-mail',
}

function detectChannel(q: string): Exclude<ChannelId, 'none'> | null {
  if (q.includes('whatsapp') || q.includes('whats') || q.includes('zap')) return 'whatsapp'
  if (q.includes('sms') || q.includes('torpedo')) return 'sms'
  if (q.includes('email') || q.includes('e-mail')) return 'email'
  return null
}

export function planResponse(text: string, ctx: PlannerContext): ResponsePlan {
  const q = normalize(text)

  // 1) EXECUTE — the most consequential command, checked first.
  if (/\bexecut/.test(q)) {
    return {
      narration: 'Executando a campanha aprovada. Vou acompanhar em tempo real.',
      steps: ['Preparando execução', 'Executando'],
      tool: 'execute_campaign',
      intent: null,
    }
  }

  // 2) APPROVE — human-in-the-loop gate.
  if (/\baprov/.test(q)) {
    return {
      narration: 'Preparei a aprovação — a decisão de executar é sua.',
      steps: ['Preparando aprovação'],
      tool: 'request_human_approval',
      intent: null,
    }
  }

  // 3) CHOOSE CHANNEL — mutates the existing simulation artifact in place.
  const channel = detectChannel(q)
  const choosing = /\bescolh|selecion|vai de|prefiro|usar|use |fica com|manda|envia/.test(q)
  if (channel && (choosing || ctx.hasSimulation)) {
    const label = CHANNEL_LABEL[channel]
    return {
      narration: `Atualizei a decisão para ${label}. A aprovação já assume esse canal.`,
      steps: ['Atualizando decisão'],
      tool: 'select_channel',
      args: { channel },
      mutateState: 'modified',
      intent: null,
    }
  }

  // 4) SIMULATE — compares strategies inline.
  if (/\bsimul/.test(q)) {
    return {
      narration: 'Comparando as estratégias por canal antes de qualquer envio.',
      steps: ['Simulando estratégia', 'Projetando recuperação'],
      tool: 'run_recovery_simulation',
      intent: null,
    }
  }

  // 5) "Qual canal funcionou melhor?" — answer + highlight existing artifact.
  if (/\bqual canal|melhor canal|canal (funcion|teve|foi|converteu)/.test(q)) {
    return {
      narration: 'WhatsApp teve o melhor desempenho — maior taxa de resposta e recuperação associada.',
      steps: ['Comparando canais'],
      tool: 'highlight_communication',
      intent: null,
    }
  }

  // 6) "Por que Enterprise?" — explains a segment already in the thread.
  if (/\bpor ?que|porque/.test(q) && /enterprise|segmento|priori/.test(q)) {
    const seg = ctx.selectedSegment ?? 'Enterprise'
    return {
      narration: `${seg} lidera em recuperação esperada por cliente e responde melhor no WhatsApp — por isso ficou em primeiro no ranking.`,
      steps: ['Revisando a priorização'],
      tool: 'highlight_priority',
      intent: null,
    }
  }

  // 7) "E quanto disso virou recuperação?" — links activity to money.
  if (/(quanto).*(recupera|pagament|virou|gerou|resultou)|recuper(ou|amos)/.test(q)) {
    return WORKSPACE_PLAN.OUTCOME_SUMMARY
  }

  // 8) Communication activity.
  if (
    /quantas (mensagens|conversas)|mensagens (respond|enviad|hoje)|atividade de comunic|respondi hoje|quantas respostas/.test(
      q,
    )
  ) {
    return WORKSPACE_PLAN.COMMUNICATION_ACTIVITY
  }

  // 9) Agent performance.
  if (/desempenho|performance|como (voce|vc) (esta|vem|ta)|seu resultado|produtiv/.test(q)) {
    return WORKSPACE_PLAN.AGENT_PERFORMANCE
  }

  // 10) Decision history / operational memory.
  if (/histor|decis(oes|ao)|o que (ja )?fizemos|jornada|linha do tempo|resumo da sess/.test(q)) {
    return WORKSPACE_PLAN.DECISION_HISTORY
  }

  // 11) Learning recap.
  if (/aprend/.test(q)) {
    return {
      narration: 'Veja o que consolidei para priorizar as próximas decisões.',
      steps: ['Consolidando aprendizado'],
      tool: 'show_learning',
      intent: null,
    }
  }

  // 12) Fall back to a brand-new financial workspace question.
  const { intent } = classifyIntent(text)
  return WORKSPACE_PLAN[intent]
}

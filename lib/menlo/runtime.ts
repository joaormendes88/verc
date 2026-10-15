import type {
  AgentTurn,
  ArtifactType,
  ChannelId,
  FinancialIntent,
} from './types'
import { analyze } from './nlu'
import { getTool } from './tool-registry'
import { formatBRLCompact, formatPercent } from './format'

// ---------------------------------------------------------------------------
// AgentRuntime.
//
// A frontend-first runtime that behaves like a real agent even though its
// intelligence is local. The pipeline is:
//
//   receiveMessage → getContext → resolveIntent (analyze) → plan → AgentTurn
//
// `planTurn` is the plan step: it reads the semantic Analysis AND the live
// conversation context, then decides whether to answer directly, call a tool,
// mutate an artifact, ask for input, or explain — and what to suggest next.
// The store executes the returned turn progressively (activity → message →
// tool → suggestions), which is the streaming/tool-rendering model.
// ---------------------------------------------------------------------------

export interface AgentContext {
  hasOpportunity: boolean
  hasSimulation: boolean
  hasApproval: boolean
  approvalApproved: boolean
  hasExecution: boolean
  hasOutcome: boolean
  hasComparison: boolean
  hasCommunication: boolean
  hasPerformance: boolean
  hasPriority: boolean
  hasRisk: boolean
  hasLeakage: boolean
  hasCanvas: boolean
  selectedChannel: ChannelId
  selectedSegment: string | null
  filterSegment: string | null
  conversion: number
  lastArtifactType: ArtifactType | null
  canUndo: boolean
}

const CHANNEL_LABEL: Record<Exclude<ChannelId, 'none'>, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'E-mail',
}

// Brand-new financial questions map to a workspace tool + narration.
const WORKSPACE: Record<FinancialIntent, { tool: string; message: string }> = {
  RECOVERY_OPPORTUNITY: {
    tool: 'identify_recovery_opportunity',
    message: 'Encontrei uma oportunidade de recuperação de alta confiança para amanhã.',
  },
  PAYMENT_LEAKAGE: {
    tool: 'show_payment_leakage',
    message: 'Mapeei onde os pagamentos estão vazando esta semana e a exposição total.',
  },
  SEGMENT_PRIORITY: {
    tool: 'show_priority_segment',
    message: 'Ranqueei os segmentos por recuperação esperada e escolhi a prioridade da semana.',
  },
  CUSTOMER_RISK: {
    tool: 'show_customer_risk',
    message: 'Avaliei o risco por cliente e priorizei onde intervir primeiro.',
  },
  COMMUNICATION_ACTIVITY: {
    tool: 'show_communication_activity',
    message: 'Hoje respondi 1.284 mensagens. Veja a atividade por canal.',
  },
  AGENT_PERFORMANCE: {
    tool: 'show_agent_performance',
    message: 'Aqui está meu desempenho recente como operador financeiro.',
  },
  OUTCOME_SUMMARY: {
    tool: 'show_outcome_summary',
    message: 'Essas interações estiveram associadas a R$1,47M em recuperação.',
  },
  DECISION_HISTORY: {
    tool: 'show_decision_history',
    message: 'Aqui está a linha do tempo das decisões desta sessão.',
  },
  UNKNOWN: {
    tool: 'compose_generic_workspace',
    message: 'Vou compor um ponto de partida com as prioridades da semana.',
  },
}

// Suggestions are never a fixed list — they derive from what just happened.
function suggestFor(artifact: ArtifactType | 'mutate' | 'none', ctx: AgentContext): string[] {
  switch (artifact) {
    case 'opportunity':
      return ['Quanto isso representa?', 'Como você recuperaria?', 'Quero ver os clientes']
    case 'segment-priority':
      return ['Por que esse segmento?', 'Simular a recuperação', 'Mostre só Enterprise']
    case 'customer-risk':
      return ['Quem são os 10 maiores?', 'Quanto eles representam?', 'Por quê?']
    case 'payment-leakage':
      return ['Onde perco mais?', 'Como recuperar isso?', 'Quais clientes?']
    case 'metric':
      return ['Quem são esses clientes?', 'Como recuperar?', 'Simular a recuperação']
    case 'comparison':
      return ['Escolho WhatsApp', 'Por que WhatsApp?', 'Simular o vencedor']
    case 'explanation':
      return ['Qual seria a alternativa?', 'Quais são os riscos?', 'Simular outro cenário']
    case 'customer-table':
      return ['Por que estão em risco?', 'Quanto representam?', 'Como abordar?']
    case 'simulation':
      return ['E se converter 10%?', 'Escolher WhatsApp', 'Ver o pior cenário']
    case 'whatsapp':
      return ['Simular esta estratégia', 'Testar outro canal', 'Aprovar']
    case 'approval':
      return ['Aprovar', 'Editar o cenário', 'Cancelar']
    case 'execution':
      return ['Quanto gerou?', 'Comparar com a previsão', 'Ver o histórico']
    case 'outcome':
      return ['Comparar com a previsão', 'Entender o resultado', 'O que você aprendeu?']
    case 'decision-canvas':
      return ['Simular a recomendada', 'Ver os riscos', 'Comparar as três']
    case 'communication':
      return ['Qual canal converteu melhor?', 'Quanto virou recuperação?', 'Ver desempenho']
    case 'agent-performance':
      return ['O que você aprendeu?', 'Ver histórico', 'Onde investir agora?']
    case 'decision-history':
      return ['Desfazer a última', 'Ver o resultado', 'Começar de novo']
    case 'learning':
      return ['Aplicar em outro segmento', 'Ver desempenho', 'Simular com esse aprendizado']
    case 'mutate':
      if (ctx.hasSimulation) return ['Ver o pior cenário', 'Aprovar', 'Testar outro canal']
      return ['Quanto representam?', 'Quem são os maiores?', 'Por quê?']
    default:
      return ['Onde estou perdendo dinheiro?', 'Quem devo contatar amanhã?', 'Qual segmento priorizar?']
  }
}

// Small helper: build the activity list for a tool from the registry.
function activityFor(toolName: string): string[] {
  const t = getTool(toolName)
  return ['Entendendo sua pergunta', t?.activity ?? 'Compondo a resposta']
}

/**
 * Plan a single agent turn from the message and the live conversation context.
 * This is the deterministic, swappable brain — genuinely context-aware rather
 * than a phrase→answer map.
 */
export function planTurn(text: string, ctx: AgentContext): AgentTurn {
  const { operation, entities, workspaceIntent } = analyze(text)

  const turn = (t: Partial<AgentTurn> & { message: string }): AgentTurn => ({
    activity: t.toolName ? activityFor(t.toolName) : ['Entendendo sua pergunta'],
    suggestions: t.suggestions ?? suggestFor(getTool(t.toolName ?? '')?.produces ?? 'none', ctx),
    operation,
    ...t,
  })

  switch (operation) {
    // --- session controls ---------------------------------------------------
    case 'reset':
      return turn({
        message: 'Comecei uma sessão nova. O que decidimos antes continua na memória de decisões.',
        toolName: 'reset_workspace',
        activity: ['Preparando uma nova sessão'],
        suggestions: suggestFor('none', ctx),
      })

    case 'undo':
      if (!ctx.canUndo)
        return turn({ message: 'Não há nada para desfazer ainda — esta é a primeira decisão.', suggestions: suggestFor(ctx.lastArtifactType ?? 'none', ctx) })
      return turn({
        message: 'Voltei ao estado anterior. Restaurei o artefato como estava antes da última mudança.',
        activity: ['Restaurando o estado anterior'],
        // The store performs the actual UNDO; no tool needed.
      })

    // --- consequential commands ---------------------------------------------
    case 'execute':
      if (ctx.hasApproval)
        return turn({
          message: 'Aprovação confirmada. Executando a campanha — vou acompanhar em tempo real.',
          toolName: 'execute_campaign',
        })
      return turn({
        message:
          'Executar é uma ação consequente, então preciso da sua aprovação primeiro. Preparei a aprovação abaixo.',
        toolName: 'request_human_approval',
      })

    case 'approve':
      if (ctx.hasApproval)
        return turn({
          message: 'Aprovado. Executando agora.',
          toolName: 'execute_campaign',
        })
      return turn({
        message: 'Preparei a aprovação — a decisão de executar é sua.',
        toolName: 'request_human_approval',
      })

    // --- parameter adjustment (bidirectional shared state) -------------------
    case 'adjust': {
      const args: Record<string, unknown> = {}
      let what = ''
      if (entities.percent !== undefined) {
        args.conversion = entities.percent
        what = `conversão para ${formatPercent(entities.percent, 1)}`
      }
      if (entities.money !== undefined) {
        args.budget = entities.money
        what = what ? `${what} e o orçamento para ${formatBRLCompact(entities.money)}` : `orçamento para ${formatBRLCompact(entities.money)}`
      }
      return turn({
        message: `Ajustei a ${what}. Recalculei a projeção — veja a simulação atualizada.`,
        toolName: 'adjust_simulation',
        toolArgs: args,
        suggestions: ['Ver o pior cenário', 'Escolher WhatsApp', 'Aprovar'],
      })
    }

    // --- filter the active artifact -----------------------------------------
    case 'filter': {
      const seg = entities.segment ?? ctx.selectedSegment ?? 'Clientes Enterprise'
      return turn({
        message: `Filtrei a visão para ${seg}. Atualizei o artefato que já estava aberto.`,
        toolName: 'filter_artifact',
        toolArgs: { segment: seg },
      })
    }

    // --- drill into the customers behind a number ---------------------------
    case 'drilldown':
      return turn({
        message: 'Aqui estão os clientes por trás desse número, ordenados por exposição.',
        toolName: 'show_customer_table',
        toolArgs: { segment: entities.segment ?? ctx.filterSegment },
      })

    // --- explanation ---------------------------------------------------------
    case 'explain': {
      const topic = entities.channel
        ? 'channel'
        : entities.segment || /segment|priori|enterprise/.test(text.toLowerCase())
          ? 'segment'
          : ctx.hasSimulation
            ? 'channel'
            : 'decision'
      return turn({
        message: 'Deixa eu abrir os fatores que pesaram nessa escolha.',
        toolName: 'explain_decision',
        toolArgs: { topic, channel: entities.channel ?? ctx.selectedChannel },
      })
    }

    // --- a bare channel choice ----------------------------------------------
    case 'channel_pick': {
      const channel = entities.channel ?? 'whatsapp'
      const label = CHANNEL_LABEL[channel]
      return turn({
        message: `Decisão atualizada para ${label}. A simulação e a aprovação já assumem esse canal.`,
        toolName: 'select_channel',
        toolArgs: { channel },
      })
    }

    // --- comparison ----------------------------------------------------------
    case 'compare': {
      const wantsExpected = ctx.hasOutcome && /previs|esperad|projet|previsao|previsão/.test(text.toLowerCase())
      const kind = wantsExpected ? 'expected-actual' : 'channel'
      return turn({
        message: wantsExpected
          ? 'Coloquei o previsto ao lado do realizado.'
          : 'Comparei os canais lado a lado — mesma audiência, retornos diferentes.',
        toolName: 'compare_options',
        toolArgs: { kind },
      })
    }

    // --- worst case / risk ---------------------------------------------------
    case 'worst_case':
      return turn({
        message: 'Montei o cenário pessimista ao lado do cenário base para você ver o piso.',
        toolName: 'compare_options',
        toolArgs: { kind: 'scenario' },
        suggestions: ['Como mitigar isso?', 'Aprovar mesmo assim', 'Voltar ao cenário base'],
      })

    // --- strategy ------------------------------------------------------------
    case 'strategy':
      return turn({
        message:
          'A estratégia é um lembrete leve no WhatsApp com CTA de Pix na janela da manhã. Veja a prévia.',
        toolName: 'preview_whatsapp',
      })

    // --- simulate ------------------------------------------------------------
    case 'simulate':
      return turn({
        message: 'Comparando as estratégias por canal antes de qualquer envio.',
        toolName: 'run_recovery_simulation',
      })

    // --- recommend / decision canvas ----------------------------------------
    case 'recommend': {
      const budget = entities.money ?? 50_000
      return turn({
        message: `Encontrei três alocações para ${formatBRLCompact(budget)}. A primeira tem o maior retorno esperado.`,
        toolName: 'generate_decision_canvas',
        toolArgs: { budget },
      })
    }

    // --- direct numeric answer ----------------------------------------------
    case 'quantify': {
      const topic = /cliente|quant[oa]s/.test(text.toLowerCase()) && !/dinheiro|valor|real|reais|represent/.test(text.toLowerCase())
        ? 'customers'
        : /roi|retorno/.test(text.toLowerCase())
          ? 'roi'
          : 'money'
      return turn({
        message: 'Aqui está o número que responde isso, no contexto da decisão atual.',
        toolName: 'answer_metric',
        toolArgs: { topic, segment: ctx.filterSegment },
      })
    }

    // --- realized outcome ----------------------------------------------------
    case 'outcome':
      return turn({
        message: ctx.hasExecution
          ? 'Veja o resultado financeiro consolidado da campanha.'
          : 'Essas interações estiveram associadas a R$1,47M em recuperação.',
        toolName: ctx.hasExecution ? 'show_financial_outcome' : 'show_outcome_summary',
      })

    // --- direct workspace intents -------------------------------------------
    case 'communication':
      return turn({ message: WORKSPACE.COMMUNICATION_ACTIVITY.message, toolName: 'show_communication_activity' })
    case 'performance':
      return turn({ message: WORKSPACE.AGENT_PERFORMANCE.message, toolName: 'show_agent_performance' })
    case 'history':
      return turn({ message: WORKSPACE.DECISION_HISTORY.message, toolName: 'show_decision_history' })
    case 'learning':
      return turn({
        message: 'Veja o que consolidei para priorizar as próximas decisões.',
        toolName: 'show_learning',
      })

    // --- brand-new financial question ---------------------------------------
    case 'workspace':
    default: {
      const plan = WORKSPACE[workspaceIntent] ?? WORKSPACE.UNKNOWN
      return turn({ message: plan.message, toolName: plan.tool, intent: workspaceIntent })
    }
  }
}

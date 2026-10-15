'use client'

import { useMenlo, useFrontendTool } from '@/lib/menlo/store'
import {
  AGENT_PERFORMANCE,
  BASE_CONVERSION,
  COMMUNICATION_ACTIVITY,
  CUSTOMER_RISK,
  LEARNING,
  PAYMENT_LEAKAGE,
  PRIORITY_SEGMENT,
  RECOVERY_OPPORTUNITY,
  SIMULATION_RESULT,
  WHATSAPP_PLAN,
  buildDecisionCanvas,
} from '@/lib/menlo/data'
import { formatBRL, formatBRLCompact, formatNumber, formatPercent } from '@/lib/menlo/format'
import type {
  ArtifactType,
  ChannelId,
  ComparisonView,
  CustomerTableRow,
  Explanation,
  MetricAnswer,
  SimulationScenario,
} from '@/lib/menlo/types'

const CHANNEL_LABEL: Record<string, string> = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'E-mail' }

// Scale the base scenarios by a conversion relative to the baseline. This is
// what makes the simulation a mutable, bidirectional object: slider or agent
// both write a conversion and the projection recomputes from it.
function scaleScenarios(conversion: number): SimulationScenario[] {
  const factor = conversion / BASE_CONVERSION
  return SIMULATION_RESULT.scenarios.map((s) => ({
    ...s,
    expectedPayments: Math.round(s.expectedPayments * factor),
    expectedRecovery: Math.round(s.expectedRecovery * factor),
  }))
}

/**
 * The controlled registry of semantic frontend tools.
 *
 * A tool produces data / mutates state and appends (or mutates) a living
 * artifact in the thread. The runtime chooses which tool to call; the tool
 * decides which controlled artifact resolves the result. This separation is
 * what keeps the generative UI trusted rather than arbitrary.
 */
export function MenloAgentTools() {
  const { dispatch, state } = useMenlo()

  const findArtifactId = (type: ArtifactType): string | null => {
    for (let i = state.timeline.length - 1; i >= 0; i--) {
      const item = state.timeline[i]
      if (item.kind === 'artifact' && item.artifact.type === type) return item.artifact.id
    }
    return null
  }
  const hasArtifact = (type: ArtifactType) => findArtifactId(type) !== null

  // ---- Workspace composition (brand-new financial questions) --------------

  useFrontendTool({
    name: 'identify_recovery_opportunity',
    description: 'Localiza o segmento com maior recuperação esperada e adiciona a oportunidade ao thread.',
    parameters: [],
    handler: () => {
      dispatch({ type: 'SET_OPPORTUNITY', opportunity: RECOVERY_OPPORTUNITY })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'opportunity' })
    },
  })

  useFrontendTool({
    name: 'show_payment_leakage',
    description: 'Adiciona ao thread o vazamento de pagamentos: causas, exposição e a maior oportunidade.',
    parameters: [],
    handler: () => {
      dispatch({ type: 'SET_LEAKAGE', leakage: PAYMENT_LEAKAGE })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'payment-leakage' })
    },
  })

  useFrontendTool({
    name: 'show_priority_segment',
    description: 'Adiciona ao thread o segmento prioritário: ranking, canal e estratégia.',
    parameters: [],
    handler: () => {
      dispatch({ type: 'SET_PRIORITY', priority: PRIORITY_SEGMENT })
      dispatch({ type: 'SET_SHARED', patch: { selectedSegment: PRIORITY_SEGMENT.segment } })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'segment-priority' })
    },
  })

  useFrontendTool({
    name: 'show_customer_risk',
    description: 'Adiciona ao thread o risco por cliente: exposição individual e a intervenção que a reduz.',
    parameters: [],
    handler: () => {
      dispatch({ type: 'SET_RISK', risk: CUSTOMER_RISK })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'customer-risk' })
    },
  })

  useFrontendTool({
    name: 'compose_generic_workspace',
    description: 'Quando a decisão ainda não está clara, adiciona um ponto de partida com as prioridades da semana.',
    parameters: [],
    handler: () => {
      dispatch({ type: 'SET_PRIORITY', priority: PRIORITY_SEGMENT })
      dispatch({ type: 'SET_SHARED', patch: { selectedSegment: PRIORITY_SEGMENT.segment } })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'segment-priority' })
    },
  })

  // ---- Controlled generative-UI primitives --------------------------------

  useFrontendTool({
    name: 'answer_metric',
    description: 'Calcula e adiciona ao thread uma resposta numérica direta (Quanto? / Quantos?).',
    parameters: [
      { name: 'topic', type: 'string', description: 'money | customers | roi', required: false },
      { name: 'segment', type: 'string', description: 'recorte opcional', required: false },
    ],
    handler: (args) => {
      const topic = (args.topic as string) ?? 'money'
      const seg = (args.segment as string) ?? state.shared.filterSegment ?? null
      let metric: MetricAnswer

      if (topic === 'customers') {
        const count =
          state.risk?.atRiskCount ??
          state.opportunity?.customerCount ??
          state.priority?.customers ??
          RECOVERY_OPPORTUNITY.customerCount
        metric = {
          id: 'M-cust',
          label: seg ? `Clientes · ${seg}` : 'Clientes na base priorizada',
          value: formatNumber(count),
          context: state.risk
            ? 'Clientes com exposição relevante nos próximos 14 dias.'
            : 'Clientes com alta propensidade dentro da janela atual.',
          breakdown: [
            { label: 'Propensão média', value: formatPercent(state.opportunity?.propensity ?? 0.84, 0) },
            { label: 'Ticket médio', value: formatBRL(state.opportunity?.avgTicket ?? 757) },
            { label: 'Janela', value: 'Amanhã · 08–10h' },
          ],
        }
      } else if (topic === 'roi') {
        metric = {
          id: 'M-roi',
          label: 'Retorno sobre a ação',
          value: '4,2x',
          delta: '+13% vs. baseline',
          context: 'Recuperação esperada dividida pelo custo estimado da abordagem.',
        }
      } else {
        let amount =
          state.risk?.totalExposure ??
          state.leakage?.totalAtRisk ??
          state.opportunity?.expectedRecovery ??
          RECOVERY_OPPORTUNITY.expectedRecovery
        if (seg && state.priority) {
          const r = state.priority.ranking.find((x) => x.name === seg)
          if (r) amount = r.expectedRecovery
        }
        metric = {
          id: 'M-money',
          label: seg ? `Valor em jogo · ${seg}` : state.risk ? 'Exposição total' : 'Recuperação esperada',
          value: formatBRL(amount),
          delta: '+R$610K vs. semana anterior',
          context: state.risk
            ? 'Soma da exposição dos clientes em risco no período.'
            : 'Recuperação projetada para o segmento e a janela atuais.',
          breakdown: [
            { label: 'Clientes', value: formatNumber(state.risk?.atRiskCount ?? RECOVERY_OPPORTUNITY.customerCount) },
            { label: 'Ticket médio', value: formatBRL(RECOVERY_OPPORTUNITY.avgTicket) },
            { label: 'Propensão', value: formatPercent(state.opportunity?.propensity ?? 0.84, 0) },
          ],
        }
      }

      dispatch({ type: 'SET_METRIC', metric })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'metric' })
    },
  })

  useFrontendTool({
    name: 'compare_options',
    description: 'Compara canais, cenários ou previsto vs. realizado e adiciona a comparação ao thread.',
    parameters: [{ name: 'kind', type: 'string', description: 'channel | expected-actual | scenario', required: false }],
    handler: (args) => {
      const kind = ((args.kind as string) ?? 'channel') as ComparisonView['kind']
      const scenarios = state.simulation?.scenarios ?? SIMULATION_RESULT.scenarios
      let comparison: ComparisonView

      if (kind === 'expected-actual') {
        const sel =
          scenarios.find((s) => s.channel === (state.simulation?.selectedChannel ?? 'whatsapp')) ?? scenarios[0]
        const out = state.outcome
        comparison = {
          id: 'C-ea',
          kind,
          title: 'Previsto vs. realizado',
          note: 'O que a simulação projetou ao lado do que a execução de fato entregou.',
          columns: [
            { key: 'expected', label: 'Previsto' },
            { key: 'actual', label: 'Realizado', winner: true },
          ],
          rows: [
            {
              label: 'Recuperação',
              values: [formatBRLCompact(sel.expectedRecovery), formatBRLCompact(out?.recovered ?? sel.expectedRecovery)],
              emphasize: true,
            },
            {
              label: 'Pagamentos',
              values: [formatNumber(sel.expectedPayments), formatNumber(out?.payments ?? sel.expectedPayments)],
            },
            { label: 'Uplift', values: ['+11%', out?.upliftVsBaseline ?? '+13%'] },
          ],
        }
      } else if (kind === 'scenario') {
        const sel =
          scenarios.find((s) => s.channel === (state.simulation?.selectedChannel ?? 'whatsapp')) ?? scenarios[0]
        const worst = Math.round(sel.expectedRecovery * 0.58)
        const worstPay = Math.round(sel.expectedPayments * 0.58)
        comparison = {
          id: 'C-sc',
          kind,
          title: 'Cenário base vs. pessimista',
          note: 'O piso da decisão se a entrega e a resposta ficarem abaixo do esperado.',
          columns: [
            { key: 'base', label: 'Base', winner: true },
            { key: 'worst', label: 'Pessimista' },
          ],
          rows: [
            { label: 'Recuperação', values: [formatBRLCompact(sel.expectedRecovery), formatBRLCompact(worst)], emphasize: true },
            { label: 'Pagamentos', values: [formatNumber(sel.expectedPayments), formatNumber(worstPay)] },
            { label: 'Confiança', values: ['84%', '52%'] },
          ],
        }
      } else {
        const active = scenarios.filter((s) => s.channel !== 'none')
        comparison = {
          id: 'C-ch',
          kind: 'channel',
          title: 'WhatsApp, SMS e e-mail lado a lado',
          note: 'Mesma audiência, retornos diferentes. WhatsApp lidera em recuperação estimada.',
          columns: active.map((s) => ({ key: s.channel, label: s.label, winner: s.channel === 'whatsapp' })),
          rows: [
            { label: 'Recuperação', values: active.map((s) => formatBRLCompact(s.expectedRecovery)), emphasize: true },
            { label: 'Pagamentos', values: active.map((s) => formatNumber(s.expectedPayments)) },
            { label: 'Entrega', values: active.map((s) => formatPercent(s.deliveryRate, 1)) },
            { label: 'Clique', values: active.map((s) => formatPercent(s.clickRate, 1)) },
          ],
        }
      }

      dispatch({ type: 'SET_COMPARISON', comparison })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'comparison' })
    },
  })

  useFrontendTool({
    name: 'explain_decision',
    description: 'Expõe os fatores ponderados numa decisão e adiciona a explicação ao thread.',
    parameters: [
      { name: 'topic', type: 'string', description: 'channel | segment | decision', required: false },
      { name: 'channel', type: 'string', description: 'canal em foco', required: false },
    ],
    handler: (args) => {
      const topic = (args.topic as string) ?? 'decision'
      const channel = CHANNEL_LABEL[(args.channel as string) ?? state.shared.selectedChannel] ?? 'WhatsApp'
      const seg = state.shared.selectedSegment ?? 'Clientes Enterprise'
      let explanation: Explanation

      if (topic === 'channel') {
        explanation = {
          id: 'E-ch',
          headline: `Por que ${channel}?`,
          factors: [
            { label: 'Maior recuperação estimada', detail: `${channel} projeta a maior recuperação entre os canais na mesma audiência.` },
            { label: 'Melhor taxa de resposta', detail: 'Histórico de resposta no canal é consistentemente mais alto neste segmento.' },
            { label: 'Menor atrito no pagamento', detail: 'O CTA de Pix conclui o pagamento dentro do próprio fluxo.' },
          ],
          conclusion: `Comparei conversão, custo e valor potencial — ${channel} venceu pelo maior retorno estimado.`,
        }
      } else if (topic === 'segment') {
        explanation = {
          id: 'E-seg',
          headline: `Por que ${seg}?`,
          factors: [
            { label: 'Maior recuperação por cliente', detail: 'Lidera em recuperação esperada por cliente frente aos demais segmentos.' },
            { label: 'Alta propensidade de resposta', detail: 'Score de propensão acima de 0,80 na janela atual.' },
            { label: 'Afinidade com o canal', detail: `Responde melhor em ${channel}, onde a conversão é mais alta.` },
          ],
          conclusion: `${seg} ficou em primeiro por combinar maior recuperação esperada e melhor resposta no canal.`,
        }
      } else {
        explanation = {
          id: 'E-dec',
          headline: 'O que pesou nessa decisão',
          factors: [
            { label: 'Impacto financeiro', detail: 'Priorizei o caminho com a maior recuperação esperada no período.' },
            { label: 'Confiança do modelo', detail: 'A propensão de pagamento sustenta a projeção com folga.' },
            { label: 'Esforço de execução', detail: 'A ação recomendada tem o menor atrito operacional.' },
          ],
          conclusion: 'Ponderei retorno, confiança e esforço antes de recomendar o próximo passo.',
        }
      }

      dispatch({ type: 'SET_EXPLANATION', explanation })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'explanation' })
    },
  })

  useFrontendTool({
    name: 'show_customer_table',
    description: 'Lista os clientes por trás de um número e adiciona a tabela ao thread.',
    parameters: [{ name: 'segment', type: 'string', description: 'recorte opcional', required: false }],
    handler: (args) => {
      const seg = (args.segment as string) ?? state.shared.filterSegment ?? null
      let rows: CustomerTableRow[]

      if (state.risk) {
        rows = state.risk.customers.map((c) => ({
          id: c.id,
          name: c.name,
          city: c.city,
          amount: c.amountDue,
          metricLabel: 'risco',
          metric: formatPercent(c.riskScore, 0),
        }))
      } else {
        rows = (state.opportunity ?? RECOVERY_OPPORTUNITY).sample.map((c) => ({
          id: c.id,
          name: c.name,
          city: c.city,
          amount: c.amountDue,
          metricLabel: 'propensão',
          metric: formatPercent(c.propensity, 0),
        }))
      }
      rows = rows.sort((a, b) => b.amount - a.amount)

      dispatch({
        type: 'SET_CUSTOMER_TABLE',
        table: {
          id: 'T-cust',
          title: seg ? `Clientes · ${seg}` : 'Clientes por trás do número',
          note: 'Ordenados por exposição. O maior valor concentra a decisão.',
          filterSegment: seg,
          rows,
        },
      })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'customer-table' })
    },
  })

  useFrontendTool({
    name: 'generate_decision_canvas',
    description: 'Monta a superfície de decisão para uma alocação de verba e a adiciona ao thread.',
    parameters: [{ name: 'budget', type: 'number', description: 'orçamento em BRL', required: false }],
    handler: (args) => {
      const budget = (args.budget as number) ?? 50_000
      dispatch({ type: 'SET_CANVAS', canvas: buildDecisionCanvas(budget) })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'decision-canvas' })
    },
  })

  // ---- Communication / performance / memory / learning --------------------

  useFrontendTool({
    name: 'show_communication_activity',
    description: 'Adiciona ao thread a atividade de comunicação: volume por canal, taxa de resposta e recuperação.',
    parameters: [],
    handler: () => {
      dispatch({ type: 'SET_COMMUNICATION', communication: COMMUNICATION_ACTIVITY })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'communication' })
    },
  })

  useFrontendTool({
    name: 'show_agent_performance',
    description: 'Adiciona ao thread o painel de desempenho do agente ao longo do tempo.',
    parameters: [],
    handler: () => {
      dispatch({ type: 'SET_PERFORMANCE', performance: AGENT_PERFORMANCE })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'agent-performance' })
    },
  })

  useFrontendTool({
    name: 'show_decision_history',
    description: 'Adiciona ao thread a linha do tempo das decisões desta sessão (memória operacional).',
    parameters: [],
    handler: () => {
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'decision-history' })
    },
  })

  useFrontendTool({
    name: 'show_outcome_summary',
    description: 'Cruza a atividade recente com pagamentos e adiciona o resultado financeiro ao thread.',
    parameters: [],
    handler: () => {
      const wa = SIMULATION_RESULT.scenarios[0]
      dispatch({
        type: 'SET_OUTCOME',
        outcome: {
          recovered: wa.expectedRecovery,
          payments: wa.expectedPayments,
          audience: COMMUNICATION_ACTIVITY.totalMessages,
          upliftVsBaseline: '+13%',
          avgTimeToPayment: '38 min',
        },
      })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'outcome' })
    },
  })

  useFrontendTool({
    name: 'open_customer_detail',
    description: 'Adiciona ao thread o detalhe de um cliente específico da oportunidade.',
    parameters: [{ name: 'customerId', type: 'string', description: 'ID do cliente', required: true }],
    handler: (args) => {
      const id = (args.customerId as string) ?? ''
      const customer = RECOVERY_OPPORTUNITY.sample.find((c) => c.id === id) ?? null
      dispatch({ type: 'SET_CUSTOMER', customer })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'customer-detail' })
    },
  })

  useFrontendTool({
    name: 'preview_whatsapp',
    description: 'Adiciona ao thread a prévia da comunicação de WhatsApp que será enviada ao segmento.',
    parameters: [],
    handler: () => {
      dispatch({ type: 'SET_WHATSAPP', whatsapp: WHATSAPP_PLAN })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'whatsapp' })
    },
  })

  // ---- Simulation: create, mutate (versioned), select channel -------------

  useFrontendTool({
    name: 'run_recovery_simulation',
    description: 'Projeta o resultado esperado por canal e adiciona a simulação ao thread.',
    parameters: [],
    handler: () => {
      const conversion = state.shared.conversion
      dispatch({
        type: 'SET_SIMULATION',
        simulation: {
          scenarios: scaleScenarios(conversion),
          selectedChannel: state.shared.selectedChannel,
          conversion,
          budget: state.simulation?.budget ?? null,
          version: 1,
        },
      })
      if (hasArtifact('simulation')) {
        dispatch({ type: 'SET_ARTIFACT_STATE', artifactType: 'simulation', status: 'ready' })
      } else {
        dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'simulation' })
      }
    },
  })

  useFrontendTool({
    name: 'adjust_simulation',
    description: 'Recalcula a simulação existente com nova conversão e/ou orçamento (mutação versionada).',
    parameters: [
      { name: 'conversion', type: 'number', description: 'nova conversão (0-1)', required: false },
      { name: 'budget', type: 'number', description: 'novo orçamento em BRL', required: false },
    ],
    handler: (args) => {
      const conversion = (args.conversion as number) ?? state.shared.conversion
      const budget = (args.budget as number) ?? state.simulation?.budget ?? null
      const prevVersion = state.simulation?.version ?? 1
      const selectedChannel = state.simulation?.selectedChannel ?? state.shared.selectedChannel

      dispatch({ type: 'SET_SHARED', patch: { conversion } })
      dispatch({
        type: 'SET_SIMULATION',
        simulation: { scenarios: scaleScenarios(conversion), selectedChannel, conversion, budget, version: prevVersion + 1 },
      })
      if (hasArtifact('simulation')) {
        dispatch({ type: 'SET_ARTIFACT_STATE', artifactType: 'simulation', status: 'modified' })
      } else {
        dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'simulation', status: 'modified' })
      }
    },
  })

  useFrontendTool({
    name: 'select_channel',
    description: 'Seleciona o canal de recuperação — ajusta a simulação existente e a decisão compartilhada.',
    parameters: [{ name: 'channel', type: 'string', description: 'whatsapp | sms | email | none', required: true }],
    handler: (args) => {
      const channel = (args.channel as ChannelId) ?? 'whatsapp'
      dispatch({ type: 'SET_SHARED', patch: { selectedChannel: channel } })
      if (state.simulation) {
        dispatch({ type: 'SELECT_SCENARIO', channel })
        dispatch({ type: 'SET_ARTIFACT_STATE', artifactType: 'simulation', status: 'modified' })
      }
    },
  })

  useFrontendTool({
    name: 'filter_artifact',
    description: 'Aplica um recorte de segmento ao artefato ativo, sem criar um novo card.',
    parameters: [{ name: 'segment', type: 'string', description: 'segmento do recorte', required: true }],
    handler: (args) => {
      const segment = (args.segment as string) ?? 'Clientes Enterprise'
      dispatch({ type: 'SET_SHARED', patch: { filterSegment: segment, selectedSegment: segment } })
      dispatch({ type: 'SET_LAST_ARTIFACT_STATE', status: 'modified' })
      // If the active surface is a customer table, rebuild it under the recorte.
      if (state.customerTable && hasArtifact('customer-table')) {
        dispatch({
          type: 'SET_CUSTOMER_TABLE',
          table: { ...state.customerTable, title: `Clientes · ${segment}`, filterSegment: segment },
        })
      }
    },
  })

  // ---- Approval / execution / outcome -------------------------------------

  useFrontendTool({
    name: 'request_human_approval',
    description: 'Solicita a aprovação humana antes de executar uma ação financeira consequente.',
    parameters: [],
    handler: () => {
      const opp = state.opportunity ?? RECOVERY_OPPORTUNITY
      const scenario =
        state.simulation?.scenarios.find(
          (s) => s.channel === (state.simulation?.selectedChannel ?? state.shared.selectedChannel),
        ) ?? SIMULATION_RESULT.scenarios[0]
      dispatch({
        type: 'SET_APPROVAL',
        approval: {
          title: 'Aprovar campanha de recuperação',
          summary: `Lembrete leve em ${scenario.label} com CTA de Pix na janela da manhã.`,
          audience: opp.customerCount,
          channel: scenario.label,
          window: opp.window,
          expectedRecovery: scenario.expectedRecovery,
        },
      })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'approval' })
    },
  })

  useFrontendTool({
    name: 'execute_campaign',
    description: 'Executa a campanha aprovada e adiciona o acompanhamento em tempo real ao thread.',
    parameters: [],
    handler: () => {
      const scenario =
        state.simulation?.scenarios.find(
          (s) => s.channel === (state.simulation?.selectedChannel ?? state.shared.selectedChannel),
        ) ?? SIMULATION_RESULT.scenarios[0]
      dispatch({ type: 'SET_ARTIFACT_STATE', artifactType: 'approval', status: 'approved' })
      dispatch({
        type: 'SET_EXECUTION',
        execution: {
          total: (state.opportunity ?? RECOVERY_OPPORTUNITY).customerCount,
          completed: 0,
          recovered: 0,
          avgTimeToPayment: '—',
          upliftVsBaseline: scenario.channel === 'whatsapp' ? '+13%' : '+6%',
          running: true,
        },
      })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'execution', status: 'executing' })
    },
  })

  useFrontendTool({
    name: 'show_financial_outcome',
    description: 'Consolida o resultado financeiro da campanha executada e o adiciona ao thread.',
    parameters: [],
    handler: () => {
      const scenario =
        state.simulation?.scenarios.find(
          (s) => s.channel === (state.simulation?.selectedChannel ?? state.shared.selectedChannel),
        ) ?? SIMULATION_RESULT.scenarios[0]
      dispatch({ type: 'SET_ARTIFACT_STATE', artifactType: 'execution', status: 'completed' })
      dispatch({
        type: 'SET_OUTCOME',
        outcome: {
          recovered: scenario.expectedRecovery,
          payments: scenario.expectedPayments,
          audience: (state.opportunity ?? RECOVERY_OPPORTUNITY).customerCount,
          upliftVsBaseline: scenario.channel === 'whatsapp' ? '+13%' : '+6%',
          avgTimeToPayment: '38 min',
        },
      })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'outcome' })
    },
  })

  useFrontendTool({
    name: 'show_learning',
    description: 'Mostra o que o Menlo aprendeu para priorizar decisões futuras.',
    parameters: [],
    handler: () => {
      dispatch({ type: 'SET_LEARNING', learning: LEARNING })
      dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'learning', status: 'learned' })
    },
  })

  useFrontendTool({
    name: 'reset_workspace',
    description: 'Limpa o thread e retorna ao estado inicial pronto para uma nova decisão.',
    parameters: [],
    handler: () => {
      dispatch({ type: 'RESET' })
    },
  })

  return null
}

import type { ArtifactType } from './types'

// ---------------------------------------------------------------------------
// Tool Registry.
//
// A tool produces data / mutates state. A UI resolver decides how the result
// appears. They are deliberately separate concepts: the registry describes the
// tool's identity, its risk, whether it needs human approval, and which
// controlled artifact it resolves to. The runtime consults this to gate
// consequential actions and to render tool activity.
// ---------------------------------------------------------------------------

export type ToolRisk = 'read' | 'low' | 'medium' | 'high'

export interface ToolDefinition {
  id: string
  title: string
  description: string
  risk: ToolRisk
  requiresApproval: boolean
  // The artifact this tool resolves to when it appends to the thread. `mutate`
  // means it edits an existing artifact instead of creating one.
  produces: ArtifactType | 'mutate' | 'none'
  // The subtle activity line shown while the tool runs.
  activity: string
}

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  identify_recovery_opportunity: {
    id: 'recovery.analyze',
    title: 'Analisar recuperação',
    description: 'Localiza o segmento com maior recuperação esperada.',
    risk: 'read',
    requiresApproval: false,
    produces: 'opportunity',
    activity: 'Analisando propensidade em 48.210 clientes',
  },
  show_payment_leakage: {
    id: 'analytics.leakage',
    title: 'Mapear vazamento',
    description: 'Rastreia falhas de pagamento e a exposição total.',
    risk: 'read',
    requiresApproval: false,
    produces: 'payment-leakage',
    activity: 'Rastreando falhas de pagamento',
  },
  show_priority_segment: {
    id: 'customer.segment',
    title: 'Priorizar segmento',
    description: 'Ranqueia segmentos por recuperação esperada.',
    risk: 'read',
    requiresApproval: false,
    produces: 'segment-priority',
    activity: 'Comparando segmentos',
  },
  show_customer_risk: {
    id: 'customer.risk',
    title: 'Avaliar risco',
    description: 'Avalia o risco por cliente e prioriza intervenções.',
    risk: 'read',
    requiresApproval: false,
    produces: 'customer-risk',
    activity: 'Avaliando risco por cliente',
  },
  answer_metric: {
    id: 'analytics.query',
    title: 'Responder métrica',
    description: 'Calcula a resposta numérica direta para a pergunta.',
    risk: 'read',
    requiresApproval: false,
    produces: 'metric',
    activity: 'Consultando os números',
  },
  compare_options: {
    id: 'campaign.compare',
    title: 'Comparar',
    description: 'Compara canais, cenários ou previsto versus realizado.',
    risk: 'read',
    requiresApproval: false,
    produces: 'comparison',
    activity: 'Comparando as opções',
  },
  explain_decision: {
    id: 'decision.explain',
    title: 'Explicar decisão',
    description: 'Expõe os fatores ponderados — sem raciocínio privado.',
    risk: 'read',
    requiresApproval: false,
    produces: 'explanation',
    activity: 'Reunindo os fatores',
  },
  show_customer_table: {
    id: 'customer.search',
    title: 'Listar clientes',
    description: 'Lista e ranqueia os clientes por trás de um número.',
    risk: 'read',
    requiresApproval: false,
    produces: 'customer-table',
    activity: 'Buscando os clientes',
  },
  run_recovery_simulation: {
    id: 'campaign.simulate',
    title: 'Simular estratégia',
    description: 'Projeta o resultado esperado por canal.',
    risk: 'low',
    requiresApproval: false,
    produces: 'simulation',
    activity: 'Simulando a recuperação',
  },
  adjust_simulation: {
    id: 'campaign.simulate.adjust',
    title: 'Ajustar simulação',
    description: 'Recalcula a projeção com novos parâmetros.',
    risk: 'low',
    requiresApproval: false,
    produces: 'mutate',
    activity: 'Recalculando a projeção',
  },
  filter_artifact: {
    id: 'analytics.filter',
    title: 'Filtrar',
    description: 'Aplica um recorte ao artefato ativo.',
    risk: 'read',
    requiresApproval: false,
    produces: 'mutate',
    activity: 'Aplicando o filtro',
  },
  select_channel: {
    id: 'campaign.channel',
    title: 'Selecionar canal',
    description: 'Fixa o canal da recuperação na decisão compartilhada.',
    risk: 'low',
    requiresApproval: false,
    produces: 'mutate',
    activity: 'Atualizando a decisão',
  },
  generate_decision_canvas: {
    id: 'recommendation.generate',
    title: 'Montar decisão',
    description: 'Monta a superfície de decisão para uma alocação de verba.',
    risk: 'read',
    requiresApproval: false,
    produces: 'decision-canvas',
    activity: 'Preparando a decisão',
  },
  request_human_approval: {
    id: 'campaign.approve',
    title: 'Solicitar aprovação',
    description: 'Pausa para a aprovação humana antes de agir.',
    risk: 'medium',
    requiresApproval: false,
    produces: 'approval',
    activity: 'Preparando a aprovação',
  },
  execute_campaign: {
    id: 'campaign.execute',
    title: 'Executar campanha',
    description: 'Executa a campanha aprovada em tempo real.',
    risk: 'high',
    requiresApproval: true,
    produces: 'execution',
    activity: 'Executando',
  },
  show_financial_outcome: {
    id: 'outcome.summarize',
    title: 'Consolidar resultado',
    description: 'Consolida o resultado financeiro da campanha.',
    risk: 'read',
    requiresApproval: false,
    produces: 'outcome',
    activity: 'Consolidando o resultado',
  },
  show_outcome_summary: {
    id: 'outcome.query',
    title: 'Resumir recuperação',
    description: 'Cruza a atividade recente com pagamentos.',
    risk: 'read',
    requiresApproval: false,
    produces: 'outcome',
    activity: 'Cruzando com pagamentos',
  },
  show_communication_activity: {
    id: 'communication.analyze',
    title: 'Atividade de comunicação',
    description: 'Volume por canal, taxa de resposta e recuperação.',
    risk: 'read',
    requiresApproval: false,
    produces: 'communication',
    activity: 'Consultando a atividade',
  },
  show_agent_performance: {
    id: 'performance.analyze',
    title: 'Desempenho do agente',
    description: 'O histórico operacional do agente.',
    risk: 'read',
    requiresApproval: false,
    produces: 'agent-performance',
    activity: 'Reunindo métricas',
  },
  show_decision_history: {
    id: 'history.retrieve',
    title: 'Histórico de decisões',
    description: 'A memória operacional da sessão.',
    risk: 'read',
    requiresApproval: false,
    produces: 'decision-history',
    activity: 'Revisando a memória da sessão',
  },
  show_learning: {
    id: 'learning.retrieve',
    title: 'Aprendizado',
    description: 'O que o agente consolidou para próximas decisões.',
    risk: 'read',
    requiresApproval: false,
    produces: 'learning',
    activity: 'Consolidando aprendizado',
  },
  preview_whatsapp: {
    id: 'communication.preview',
    title: 'Prévia da mensagem',
    description: 'A comunicação que será enviada ao segmento.',
    risk: 'read',
    requiresApproval: false,
    produces: 'whatsapp',
    activity: 'Compondo a mensagem',
  },
  compose_generic_workspace: {
    id: 'workspace.compose',
    title: 'Ponto de partida',
    description: 'Compõe um ponto de partida útil quando a decisão não está clara.',
    risk: 'read',
    requiresApproval: false,
    produces: 'segment-priority',
    activity: 'Procurando o ângulo mais útil',
  },
}

export function getTool(name: string): ToolDefinition | undefined {
  return TOOL_REGISTRY[name]
}

export function listTools(): ToolDefinition[] {
  return Object.values(TOOL_REGISTRY)
}

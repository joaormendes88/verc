import type {
  AgentPerformance,
  CommunicationActivity,
  Customer,
  CustomerRisk,
  DecisionCanvas,
  Learning,
  PaymentLeakage,
  PrioritySegment,
  RecoveryOpportunity,
  SimulationResult,
  WhatsappPlan,
} from './types'

// All values are deterministic mock state. This proves the interaction model
// without any backend, database, or external messaging integration.

export const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: 'CU-48192',
    name: 'João Ribeiro',
    city: 'São Paulo · SP',
    amountDue: 742,
    dueLabel: 'Vence amanhã · 09:00',
    propensity: 0.91,
    channel: 'whatsapp',
    lastOutreach: 'Sem contato há 22 dias',
    status: 'pending',
  },
  {
    id: 'CU-51730',
    name: 'Mariana Costa',
    city: 'Rio de Janeiro · RJ',
    amountDue: 1280,
    dueLabel: 'Vence amanhã · 10:00',
    propensity: 0.88,
    channel: 'whatsapp',
    lastOutreach: 'Sem contato há 15 dias',
    status: 'pending',
  },
  {
    id: 'CU-44905',
    name: 'Carlos Andrade',
    city: 'Belo Horizonte · MG',
    amountDue: 560,
    dueLabel: 'Vence amanhã · 08:30',
    propensity: 0.86,
    channel: 'whatsapp',
    lastOutreach: 'Sem contato há 30 dias',
    status: 'pending',
  },
  {
    id: 'CU-60021',
    name: 'Beatriz Nunes',
    city: 'Curitiba · PR',
    amountDue: 934,
    dueLabel: 'Vence amanhã · 09:30',
    propensity: 0.83,
    channel: 'whatsapp',
    lastOutreach: 'Sem contato há 18 dias',
    status: 'pending',
  },
  {
    id: 'CU-38874',
    name: 'Rafael Teixeira',
    city: 'Porto Alegre · RS',
    amountDue: 415,
    dueLabel: 'Vence amanhã · 08:00',
    propensity: 0.8,
    channel: 'whatsapp',
    lastOutreach: 'Sem contato há 25 dias',
    status: 'pending',
  },
]

export const RECOVERY_OPPORTUNITY: RecoveryOpportunity = {
  id: 'OPP-2041',
  title: 'Recuperação pré-vencimento',
  segment: 'Alta propensidade · Janela de amanhã · Afinidade com WhatsApp',
  customerCount: 2431,
  expectedRecovery: 1_840_000,
  avgTicket: 757,
  propensity: 0.84,
  window: 'Amanhã · 08:00–10:00',
  criteria: [
    { label: 'Alta propensidade de pagamento', detail: 'Score ≥ 0,80 no modelo de recuperação' },
    { label: 'Sem contato recente', detail: 'Nenhuma abordagem nos últimos 14 dias' },
    { label: 'Janela de pagamento amanhã', detail: 'Vencimento nas próximas 24h' },
    { label: 'Afinidade com WhatsApp', detail: 'Histórico de resposta no canal' },
  ],
  sample: SAMPLE_CUSTOMERS,
}

// --- Payment leakage workspace ----------------------------------------------

export const PAYMENT_LEAKAGE: PaymentLeakage = {
  id: 'LEAK-0912',
  totalAtRisk: 4_820_000,
  period: 'Esta semana · 7 dias',
  trend: '+R$610K vs. semana anterior',
  categories: [
    {
      label: 'Pagamentos em atraso',
      share: 0.38,
      amount: 1_832_000,
      cause: 'Vencimentos ultrapassados sem nenhuma cobrança ativa',
    },
    {
      label: 'Pix não concluído',
      share: 0.27,
      amount: 1_301_000,
      cause: 'QR Code gerado, mas pagamento abandonado antes da confirmação',
    },
    {
      label: 'Cartão recusado',
      share: 0.19,
      amount: 916_000,
      cause: 'Falha de autorização sem tentativa de recuperação (retry)',
    },
    {
      label: 'Sem follow-up',
      share: 0.16,
      amount: 771_000,
      cause: 'Promessa de pagamento sem lembrete de acompanhamento',
    },
  ],
  largest: {
    segment: 'Clientes Enterprise',
    amount: 1_840_000,
    detail: 'Maior exposição concentrada — recuperável com cobrança dedicada',
  },
}

// --- Priority segment workspace ----------------------------------------------

export const PRIORITY_SEGMENT: PrioritySegment = {
  id: 'SEG-3307',
  segment: 'Clientes Enterprise',
  expectedRecovery: 2_310_000,
  customers: 1284,
  propensity: 0.89,
  bestChannel: 'WhatsApp',
  bestIntervention: 'Lembrete de pagamento + CTA de Pix',
  rationale:
    'Maior recuperação esperada por cliente combinada à alta propensidade de resposta no canal.',
  ranking: [
    { name: 'Clientes Enterprise', expectedRecovery: 2_310_000, score: 0.89, customers: 1284, recommended: true },
    { name: 'PMEs · alto ticket', expectedRecovery: 1_420_000, score: 0.76, customers: 2140 },
    { name: 'Varejo recorrente', expectedRecovery: 880_000, score: 0.64, customers: 5310 },
    { name: 'Novos clientes', expectedRecovery: 410_000, score: 0.48, customers: 1890 },
  ],
}

// --- Customer risk workspace -------------------------------------------------

export const CUSTOMER_RISK: CustomerRisk = {
  id: 'RISK-1188',
  totalExposure: 3_240_000,
  atRiskCount: 642,
  period: 'Próximos 14 dias',
  topDriver: 'Atraso recorrente combinado a queda de engajamento no canal',
  customers: [
    {
      id: 'CU-77420',
      name: 'Construtora Vale',
      city: 'São Paulo · SP',
      amountDue: 184_000,
      riskScore: 0.92,
      driver: '2 faturas em atraso · sem resposta há 19 dias',
    },
    {
      id: 'CU-63188',
      name: 'Logística Andrade',
      city: 'Campinas · SP',
      amountDue: 96_400,
      riskScore: 0.87,
      driver: 'Cartão recusado 3x · sem método alternativo',
    },
    {
      id: 'CU-58021',
      name: 'Óptica Horizonte',
      city: 'Recife · PE',
      amountDue: 42_800,
      riskScore: 0.81,
      driver: 'Pix abandonado · engajamento em queda',
    },
    {
      id: 'CU-49930',
      name: 'Padaria Trigo Real',
      city: 'Salvador · BA',
      amountDue: 28_300,
      riskScore: 0.78,
      driver: 'Promessa de pagamento não cumprida · sem follow-up',
    },
  ],
}

// --- Communication activity artifact ----------------------------------------

export const COMMUNICATION_ACTIVITY: CommunicationActivity = {
  id: 'COMM-2209',
  period: 'Hoje · até agora',
  totalMessages: 1284,
  responded: 1284,
  avgResponseTime: '1,8 s',
  linkedRecovery: 1_470_000,
  bestChannel: 'WhatsApp',
  channels: [
    { channel: 'WhatsApp', count: 812, share: 0.63, responseRate: 0.72 },
    { channel: 'SMS', count: 284, share: 0.22, responseRate: 0.41 },
    { channel: 'E-mail', count: 188, share: 0.15, responseRate: 0.28 },
  ],
}

// --- Agent performance artifact ----------------------------------------------

export const AGENT_PERFORMANCE: AgentPerformance = {
  id: 'PERF-0077',
  period: 'Últimos 7 dias',
  decisions: 38,
  campaignsExecuted: 9,
  totalRecovered: 8_900_000,
  avgUplift: '+11%',
  autonomyRate: 0.74,
  breakdown: [
    { label: 'Recuperação pré-vencimento', recovered: 4_120_000, share: 0.46 },
    { label: 'Cobrança de atraso', recovered: 2_670_000, share: 0.3 },
    { label: 'Retry de cartão', recovered: 1_420_000, share: 0.16 },
    { label: 'Reengajamento', recovered: 690_000, share: 0.08 },
  ],
}

export const WHATSAPP_PLAN: WhatsappPlan = {
  greeting: 'Olá, João 👋',
  body: 'Identificamos que seu pagamento está próximo da data prevista. Você pode concluir agora, em segundos, via Pix.',
  cta: 'Pagar via Pix',
  audience: 2431,
  channel: 'WhatsApp',
  window: '08:00–10:00',
  strategy: 'Lembrete leve + CTA Pix',
}

// The conversion the base projection assumes. Adjusting conversion (slider or
// "aumente para 10%") scales the scenarios relative to this baseline.
export const BASE_CONVERSION = 0.084

export const SIMULATION_RESULT: SimulationResult = {
  selectedChannel: 'whatsapp',
  conversion: BASE_CONVERSION,
  budget: null,
  version: 1,
  scenarios: [
    {
      channel: 'whatsapp',
      label: 'WhatsApp',
      expectedPayments: 942,
      expectedRecovery: 1_470_000,
      deliveryRate: 0.968,
      clickRate: 0.184,
      recommended: true,
    },
    {
      channel: 'sms',
      label: 'SMS',
      expectedPayments: 604,
      expectedRecovery: 941_000,
      deliveryRate: 0.923,
      clickRate: 0.086,
    },
    {
      channel: 'email',
      label: 'E-mail',
      expectedPayments: 388,
      expectedRecovery: 604_000,
      deliveryRate: 0.874,
      clickRate: 0.052,
    },
    {
      channel: 'none',
      label: 'Sem abordagem',
      expectedPayments: 214,
      expectedRecovery: 333_000,
      deliveryRate: 0,
      clickRate: 0,
    },
  ],
}

export const LEARNING: Learning = {
  insights: [
    {
      headline: 'Abordagem matinal no WhatsApp teve desempenho 13% melhor',
      detail: 'A janela 08:00–10:00 superou o restante do dia em conversão de pagamento.',
    },
    {
      headline: 'CTA de Pix aumentou a conversão em 8,4%',
      detail: 'Concluir o pagamento no próprio fluxo reduziu o atrito de forma significativa.',
    },
  ],
  nextAction:
    'Menlo vai priorizar essa estratégia para segmentos semelhantes de alta propensidade.',
}

// --- Decision canvas ---------------------------------------------------------
// The living surface behind "onde devo investir os próximos R$50k?". Each
// option is weighed on return, risk, confidence and effort so the user can act.

export function buildDecisionCanvas(budget: number): DecisionCanvas {
  return {
    id: 'CANVAS-5001',
    question: `Onde alocar os próximos ${new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(budget)}?`,
    budget,
    recommendedId: 'recover-preventive',
    options: [
      {
        id: 'recover-preventive',
        label: 'Recuperação pré-vencimento',
        expectedReturn: Math.round(budget * 4.2),
        risk: 'baixo',
        confidence: 0.84,
        effort: 'baixo',
        detail: 'Lembretes matinais no WhatsApp para o segmento de alta propensidade.',
      },
      {
        id: 'retry-card',
        label: 'Retry inteligente de cartão',
        expectedReturn: Math.round(budget * 3.1),
        risk: 'médio',
        confidence: 0.71,
        effort: 'médio',
        detail: 'Reprocessar autorizações recusadas na melhor janela do emissor.',
      },
      {
        id: 'reengage-enterprise',
        label: 'Reengajar Enterprise em atraso',
        expectedReturn: Math.round(budget * 2.6),
        risk: 'alto',
        confidence: 0.58,
        effort: 'alto',
        detail: 'Cobrança dedicada para a maior exposição concentrada.',
      },
    ],
  }
}

// Total addressable base referenced during the "understanding" moment.
export const TOTAL_BASE = 48210

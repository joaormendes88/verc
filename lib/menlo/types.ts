// Central domain + UI-state model for Menlo — the AI financial decision environment.
// Every consequential financial decision gets its own "surface". The agent decides
// WHICH surface appears; the application owns HOW it renders.

export type FinancialSurface =
  | 'idle'
  | 'understanding'
  | 'context'
  | 'opportunity'
  | 'payment-leakage'
  | 'segment-priority'
  | 'customer-risk'
  | 'customer-detail'
  | 'whatsapp'
  | 'simulation'
  | 'approval'
  | 'execution'
  | 'outcome'
  | 'learning'

// The deterministic classification of a financial question. The agent chooses
// a capability based on this, and the capability composes the right workspace.
export type FinancialIntent =
  | 'RECOVERY_OPPORTUNITY'
  | 'PAYMENT_LEAKAGE'
  | 'SEGMENT_PRIORITY'
  | 'CUSTOMER_RISK'
  | 'COMMUNICATION_ACTIVITY'
  | 'AGENT_PERFORMANCE'
  | 'OUTCOME_SUMMARY'
  | 'DECISION_HISTORY'
  | 'UNKNOWN'

export type ChannelId = 'whatsapp' | 'sms' | 'email' | 'none'

// ---- Semantic conversation layer -------------------------------------------
// The runtime classifies each message into an OPERATION (what the user wants
// done) plus the ENTITIES it mentions. This is what makes different questions
// produce genuinely different behavior instead of one canned artifact.

export type AgentOperation =
  | 'workspace' // a brand-new financial question → compose a workspace
  | 'quantify' // "quanto? / quantos?" → a direct metric answer
  | 'compare' // "whatsapp ou email? / compare"
  | 'strategy' // "como? / de que forma?"
  | 'simulate' // "simule / projete"
  | 'adjust' // "aumente para 10% / e se converter 12% / com R$50 mil"
  | 'filter' // "mostre só Enterprise"
  | 'drilldown' // "quem são os 10 maiores / ver clientes"
  | 'explain' // "por quê?"
  | 'channel_pick' // "WhatsApp." (a bare choice)
  | 'recommend' // "onde devo investir / recomende"
  | 'worst_case' // "pior cenário / quais os riscos"
  | 'approve' // "aprovar"
  | 'execute' // "executar"
  | 'outcome' // "quanto gerou? / resultado real"
  | 'communication' // "quantas mensagens hoje?"
  | 'performance' // "como você está indo?"
  | 'history' // "mostre o histórico / o que aconteceu"
  | 'learning' // "o que você aprendeu?"
  | 'undo' // "desfaça / volte para a simulação anterior"
  | 'reset' // "começar de novo"

export interface AgentEntities {
  channel?: Exclude<ChannelId, 'none'>
  segment?: string
  percent?: number // 0-1
  money?: number // absolute BRL
  count?: number
  superlative?: 'top' | 'worst' | 'best'
}

export interface Analysis {
  operation: AgentOperation
  entities: AgentEntities
  workspaceIntent: FinancialIntent
  normalized: string
}

// A single planned turn produced by the runtime. The store renders it
// progressively: activity → message → tool (append/mutate artifact) →
// suggestions, optionally pausing for human input (interrupt).
export interface AgentTurn {
  message: string
  activity: string[]
  toolName?: string
  toolArgs?: Record<string, unknown>
  suggestions: string[]
  requiresInput?: HumanInputRequest
  operation: AgentOperation
  intent?: FinancialIntent
}

// A human-in-the-loop interrupt. The agent pauses; the UI collects a typed
// value; the agent resumes with it. Rendered inline as interactive controls,
// never as another text question.
export interface HumanInputRequest {
  id: string
  kind: 'channel' | 'confirm'
  prompt: string
  options?: { value: string; label: string }[]
  resumeTool?: string
}

// Operational memory: every meaningful action is recorded as an event with
// enough context to explain what changed and to power undo.
export interface DecisionEvent {
  id: string
  ts: number
  actor: 'user' | 'menlo'
  action: string
  detail?: string
  artifactType?: ArtifactType
}

export interface Customer {
  id: string
  name: string
  city: string
  amountDue: number
  dueLabel: string
  propensity: number // 0-1 payment propensity
  channel: ChannelId
  lastOutreach: string
  status: 'pending' | 'paid'
}

export interface OpportunityCriterion {
  label: string
  detail: string
}

export interface RecoveryOpportunity {
  id: string
  title: string
  segment: string
  customerCount: number
  expectedRecovery: number
  avgTicket: number
  propensity: number // aggregate 0-1
  window: string
  criteria: OpportunityCriterion[]
  sample: Customer[]
}

// ---- Payment leakage workspace ----
// Emphasises failure causes, financial exposure and the largest opportunity.

export interface LeakageCategory {
  label: string
  share: number // 0-1 of total exposure
  amount: number
  cause: string
}

export interface LeakageOpportunity {
  segment: string
  amount: number
  detail: string
}

export interface PaymentLeakage {
  id: string
  totalAtRisk: number
  period: string
  trend: string
  categories: LeakageCategory[]
  largest: LeakageOpportunity
}

// ---- Priority segment workspace ----
// Emphasises segment ranking, channel and intervention strategy.

export interface SegmentRanking {
  name: string
  expectedRecovery: number
  score: number // 0-1 priority score
  customers: number
  recommended?: boolean
}

export interface PrioritySegment {
  id: string
  segment: string
  expectedRecovery: number
  customers: number
  propensity: number // 0-1
  bestChannel: string
  bestIntervention: string
  rationale: string
  ranking: SegmentRanking[]
}

// ---- Customer risk workspace ----
// Emphasises per-customer exposure and the intervention that reduces it.

export interface RiskCustomer {
  id: string
  name: string
  city: string
  amountDue: number
  riskScore: number // 0-1 probability of loss
  driver: string
}

export interface CustomerRisk {
  id: string
  totalExposure: number
  atRiskCount: number
  period: string
  topDriver: string
  customers: RiskCustomer[]
}

// ---- Communication activity artifact ----
// "Quantas mensagens você respondeu hoje?" — activity over time, by channel.

export interface ChannelActivity {
  channel: string
  count: number
  share: number // 0-1
  responseRate: number // 0-1
}

export interface CommunicationActivity {
  id: string
  period: string
  totalMessages: number
  responded: number
  avgResponseTime: string
  linkedRecovery: number
  bestChannel: string
  channels: ChannelActivity[]
}

// ---- Agent performance artifact ----
// "Como você está indo?" — the agent's own operating record.

export interface PerformanceBreakdown {
  label: string
  recovered: number
  share: number // 0-1
}

export interface AgentPerformance {
  id: string
  period: string
  decisions: number
  campaignsExecuted: number
  totalRecovered: number
  avgUplift: string
  autonomyRate: number // 0-1
  breakdown: PerformanceBreakdown[]
}

export interface WhatsappPlan {
  greeting: string
  body: string
  cta: string
  audience: number
  channel: string
  window: string
  strategy: string
}

export interface SimulationScenario {
  channel: ChannelId
  label: string
  expectedPayments: number
  expectedRecovery: number
  deliveryRate: number // 0-1
  clickRate: number // 0-1
  recommended?: boolean
}

export interface SimulationResult {
  scenarios: SimulationScenario[]
  selectedChannel: ChannelId
  // Bidirectional shared state: the conversion the projection assumes. The UI
  // slider and the agent ("aumente para 10%") both write here; scenarios are
  // recomputed from it. `version` bumps subtly each time the decision evolves.
  conversion: number // 0-1
  budget: number | null
  version: number
}

// ---- Controlled generative-UI primitives -----------------------------------
// The agent never emits arbitrary React. It emits typed instructions that the
// UI resolver maps to one of these trusted components.

// A direct financial answer — the response to "Quanto? / Quantos?". Not a full
// workspace, just the number that answers the question, in context.
export interface MetricAnswer {
  id: string
  label: string
  value: string
  delta?: string
  context: string
  breakdown?: { label: string; value: string }[]
}

// A side-by-side comparison — channels, scenarios, or expected-vs-actual.
export interface ComparisonColumn {
  key: string
  label: string
  winner?: boolean
}
export interface ComparisonRow {
  label: string
  values: string[]
  emphasize?: boolean
}
export interface ComparisonView {
  id: string
  kind: 'channel' | 'expected-actual' | 'scenario'
  title: string
  note: string
  columns: ComparisonColumn[]
  rows: ComparisonRow[]
}

// A concise operational explanation — the answer to "Por quê?". Never exposes
// private chain-of-thought; it states the factors that were weighed.
export interface Explanation {
  id: string
  headline: string
  factors: { label: string; detail: string }[]
  conclusion: string
}

// A ranked, drillable customer list — "quem são os 10 maiores / ver clientes".
export interface CustomerTableRow {
  id: string
  name: string
  city: string
  amount: number
  metricLabel: string
  metric: string
}
export interface CustomerTableView {
  id: string
  title: string
  note: string
  filterSegment: string | null
  rows: CustomerTableRow[]
}

// The Decision Canvas — a living surface for "onde devo investir R$50k?".
// Options carry return, risk, confidence and effort so the user can weigh and
// act directly instead of reading a paragraph.
export interface DecisionOption {
  id: string
  label: string
  expectedReturn: number
  risk: 'baixo' | 'médio' | 'alto'
  confidence: number // 0-1
  effort: 'baixo' | 'médio' | 'alto'
  detail: string
}
export interface DecisionCanvas {
  id: string
  question: string
  budget: number
  options: DecisionOption[]
  recommendedId: string
}

export interface ApprovalRequest {
  title: string
  summary: string
  audience: number
  channel: string
  window: string
  expectedRecovery: number
}

export interface ExecutionState {
  total: number
  completed: number
  recovered: number
  avgTimeToPayment: string
  upliftVsBaseline: string
  running: boolean
}

export interface FinancialOutcome {
  recovered: number
  payments: number
  audience: number
  upliftVsBaseline: string
  avgTimeToPayment: string
}

export interface LearningInsight {
  headline: string
  detail: string
}

export interface Learning {
  insights: LearningInsight[]
  nextAction: string
}

// ---- Agent narration (the "understanding" moment) ----

export interface UnderstandingStep {
  label: string
  status: 'active' | 'done'
}

export interface ConductorEntry {
  id: string
  role: 'user' | 'menlo'
  text: string
}

// ---- Rich thread model ----
// Menlo's primary surface is a persistent thread: not just messages, but
// application state over time. Every generated workspace becomes an inline
// artifact that stays in the thread; actions append to it rather than
// replacing the page. This model is intentionally local (React state) but
// shaped for future persistence.

// The kind of financial workspace an artifact embeds.
export type ArtifactType =
  | 'opportunity'
  | 'payment-leakage'
  | 'segment-priority'
  | 'customer-risk'
  | 'customer-detail'
  | 'whatsapp'
  | 'simulation'
  | 'approval'
  | 'execution'
  | 'outcome'
  | 'learning'
  | 'communication'
  | 'agent-performance'
  | 'decision-history'
  // Controlled generative-UI primitives the agent composes on demand.
  | 'metric'
  | 'comparison'
  | 'explanation'
  | 'customer-table'
  | 'decision-canvas'

// The lifecycle of a generated artifact. Transitions are subtle, never loud.
export type ArtifactState =
  | 'analyzing'
  | 'ready'
  | 'interacting'
  | 'modified'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'learned'

export interface ThreadMessage {
  id: string
  role: 'user' | 'menlo'
  content: string
  ts: number
}

export interface ThreadArtifact {
  id: string
  type: ArtifactType
  status: ArtifactState
  ts: number
}

// A single ordered entry in the thread: either something said, or something
// generated. Interleaving them by order is what makes the thread feel alive.
export type TimelineItem =
  | { id: string; kind: 'message'; message: ThreadMessage }
  | { id: string; kind: 'artifact'; artifact: ThreadArtifact }

// State the conversation and the application both operate over. Follow-up
// questions read this so the user never has to repeat themselves.
export interface SharedState {
  selectedChannel: ChannelId
  selectedSegment: string | null
  // The active filter applied to list/segmented artifacts ("só Enterprise").
  filterSegment: string | null
  // The conversion the whole decision currently assumes (0-1). Mirrored by the
  // simulation slider and mutable from natural language.
  conversion: number
}

// ---- Central UI state ----

export interface MenloState {
  // Thread is the product surface.
  timeline: TimelineItem[]
  shared: SharedState
  agentStatus: string | null
  highlightId: string | null
  thinking: boolean
  intent: FinancialIntent | null

  // Contextual next-steps derived from the current artifact and state.
  suggestions: string[]
  // A pending human-in-the-loop interrupt; the agent is paused until resolved.
  pendingInput: HumanInputRequest | null
  // Operational memory of everything that happened, newest last.
  events: DecisionEvent[]
  // Snapshots for undo. Newest last. Excludes transient/history fields.
  past: MenloSnapshot[]

  // Live data each artifact reads from. Kept as singletons because the
  // deterministic prototype shows at most one live instance of each type.
  opportunity: RecoveryOpportunity | null
  leakage: PaymentLeakage | null
  priority: PrioritySegment | null
  risk: CustomerRisk | null
  communication: CommunicationActivity | null
  performance: AgentPerformance | null
  selectedCustomer: Customer | null
  whatsapp: WhatsappPlan | null
  simulation: SimulationResult | null
  approval: ApprovalRequest | null
  execution: ExecutionState | null
  outcome: FinancialOutcome | null
  learning: Learning | null

  // Controlled generative-UI singletons.
  metric: MetricAnswer | null
  comparison: ComparisonView | null
  explanation: Explanation | null
  customerTable: CustomerTableView | null
  canvas: DecisionCanvas | null
}

// The slice of state captured for undo. It reverts the DATA of a decision
// (simulation, filters, generated artifacts' payloads) while the thread and
// operational memory stay intact — so "volte para a simulação anterior"
// restores the numbers without erasing the conversation.
export type MenloSnapshot = Omit<
  MenloState,
  'agentStatus' | 'thinking' | 'suggestions' | 'pendingInput' | 'past' | 'timeline' | 'events'
>

export function snapshot(state: MenloState): MenloSnapshot {
  const { agentStatus, thinking, suggestions, pendingInput, past, timeline, events, ...rest } =
    state
  return rest
}

// ---- Frontend tool contract (CopilotKit-ready) ----
// Mirrors the shape of `useFrontendTool({ name, description, parameters, handler })`
// so migrating to @copilotkit/react-core/v2 is a mechanical swap.

export interface FrontendToolParameter {
  name: string
  type: 'string' | 'number' | 'boolean'
  description: string
  required?: boolean
}

export interface FrontendTool<Args = Record<string, unknown>> {
  name: string
  description: string
  parameters: FrontendToolParameter[]
  handler: (args: Args) => void | Promise<void>
}

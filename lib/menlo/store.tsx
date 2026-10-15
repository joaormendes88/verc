'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import type {
  AgentPerformance,
  ApprovalRequest,
  ArtifactState,
  ArtifactType,
  ComparisonView,
  CommunicationActivity,
  CustomerRisk,
  CustomerTableView,
  DecisionCanvas,
  DecisionEvent,
  ExecutionState,
  Explanation,
  FinancialIntent,
  FinancialOutcome,
  FrontendTool,
  HumanInputRequest,
  Learning,
  MenloState,
  MenloSnapshot,
  MetricAnswer,
  PaymentLeakage,
  PrioritySegment,
  RecoveryOpportunity,
  SharedState,
  SimulationResult,
  Customer,
  WhatsappPlan,
  ChannelId,
} from './types'
import { snapshot } from './types'
import { BASE_CONVERSION } from './data'
import { planTurn, type AgentContext } from './runtime'

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type Action =
  | { type: 'APPEND_MESSAGE'; role: 'user' | 'menlo'; content: string }
  | { type: 'APPEND_ARTIFACT'; artifactType: ArtifactType; status?: ArtifactState }
  | { type: 'SET_ARTIFACT_STATE'; artifactType: ArtifactType; status: ArtifactState }
  | { type: 'SET_LAST_ARTIFACT_STATE'; status: ArtifactState }
  | { type: 'SET_AGENT_STATUS'; status: string | null }
  | { type: 'SET_HIGHLIGHT'; id: string | null }
  | { type: 'SET_SHARED'; patch: Partial<SharedState> }
  | { type: 'SET_INTENT'; intent: FinancialIntent }
  | { type: 'SET_THINKING'; thinking: boolean }
  | { type: 'SET_SUGGESTIONS'; suggestions: string[] }
  | { type: 'SET_PENDING_INPUT'; pending: HumanInputRequest | null }
  | { type: 'APPEND_EVENT'; event: Omit<DecisionEvent, 'id' | 'ts'> }
  | { type: 'PUSH_SNAPSHOT' }
  | { type: 'UNDO' }
  | { type: 'SET_OPPORTUNITY'; opportunity: RecoveryOpportunity }
  | { type: 'SET_LEAKAGE'; leakage: PaymentLeakage }
  | { type: 'SET_PRIORITY'; priority: PrioritySegment }
  | { type: 'SET_RISK'; risk: CustomerRisk }
  | { type: 'SET_COMMUNICATION'; communication: CommunicationActivity }
  | { type: 'SET_PERFORMANCE'; performance: AgentPerformance }
  | { type: 'SET_CUSTOMER'; customer: Customer | null }
  | { type: 'SET_WHATSAPP'; whatsapp: WhatsappPlan }
  | { type: 'SET_SIMULATION'; simulation: SimulationResult }
  | { type: 'SELECT_SCENARIO'; channel: ChannelId }
  | { type: 'SET_APPROVAL'; approval: ApprovalRequest }
  | { type: 'SET_EXECUTION'; execution: ExecutionState }
  | { type: 'UPDATE_EXECUTION'; patch: Partial<ExecutionState> }
  | { type: 'SET_OUTCOME'; outcome: FinancialOutcome }
  | { type: 'SET_LEARNING'; learning: Learning }
  | { type: 'SET_METRIC'; metric: MetricAnswer }
  | { type: 'SET_COMPARISON'; comparison: ComparisonView }
  | { type: 'SET_EXPLANATION'; explanation: Explanation }
  | { type: 'SET_CUSTOMER_TABLE'; table: CustomerTableView }
  | { type: 'SET_CANVAS'; canvas: DecisionCanvas }
  | { type: 'RESET' }

export const initialState: MenloState = {
  timeline: [],
  shared: {
    selectedChannel: 'whatsapp',
    selectedSegment: null,
    filterSegment: null,
    conversion: BASE_CONVERSION,
  },
  agentStatus: null,
  highlightId: null,
  thinking: false,
  intent: null,
  suggestions: [],
  pendingInput: null,
  events: [],
  past: [],
  opportunity: null,
  leakage: null,
  priority: null,
  risk: null,
  communication: null,
  performance: null,
  selectedCustomer: null,
  whatsapp: null,
  simulation: null,
  approval: null,
  execution: null,
  outcome: null,
  learning: null,
  metric: null,
  comparison: null,
  explanation: null,
  customerTable: null,
  canvas: null,
}

let seq = 0
const nextId = (prefix: string) => `${prefix}${seq++}`

// The set of data/state fields undo restores. Kept in one place so PUSH_SNAPSHOT
// and UNDO stay in sync with the MenloSnapshot type.
function restoreSnapshot(state: MenloState, snap: MenloSnapshot): MenloState {
  return { ...state, ...snap }
}

function reducer(state: MenloState, action: Action): MenloState {
  switch (action.type) {
    case 'APPEND_MESSAGE': {
      const id = nextId('t')
      return {
        ...state,
        timeline: [
          ...state.timeline,
          {
            id,
            kind: 'message',
            message: { id: nextId('m'), role: action.role, content: action.content, ts: Date.now() },
          },
        ],
      }
    }
    case 'APPEND_ARTIFACT': {
      const id = nextId('t')
      return {
        ...state,
        timeline: [
          ...state.timeline,
          {
            id,
            kind: 'artifact',
            artifact: {
              id: nextId('a'),
              type: action.artifactType,
              status: action.status ?? 'ready',
              ts: Date.now(),
            },
          },
        ],
      }
    }
    case 'SET_ARTIFACT_STATE': {
      let done = false
      const timeline = [...state.timeline]
      for (let i = timeline.length - 1; i >= 0 && !done; i--) {
        const item = timeline[i]
        if (item.kind === 'artifact' && item.artifact.type === action.artifactType) {
          timeline[i] = { ...item, artifact: { ...item.artifact, status: action.status } }
          done = true
        }
      }
      return { ...state, timeline }
    }
    case 'SET_LAST_ARTIFACT_STATE': {
      let done = false
      const timeline = [...state.timeline]
      for (let i = timeline.length - 1; i >= 0 && !done; i--) {
        const item = timeline[i]
        if (item.kind === 'artifact') {
          timeline[i] = { ...item, artifact: { ...item.artifact, status: action.status } }
          done = true
        }
      }
      return { ...state, timeline }
    }
    case 'SET_AGENT_STATUS':
      return { ...state, agentStatus: action.status }
    case 'SET_HIGHLIGHT':
      return { ...state, highlightId: action.id }
    case 'SET_SHARED':
      return { ...state, shared: { ...state.shared, ...action.patch } }
    case 'SET_INTENT':
      return { ...state, intent: action.intent }
    case 'SET_THINKING':
      return { ...state, thinking: action.thinking }
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.suggestions }
    case 'SET_PENDING_INPUT':
      return { ...state, pendingInput: action.pending }
    case 'APPEND_EVENT':
      return {
        ...state,
        events: [...state.events, { id: nextId('e'), ts: Date.now(), ...action.event }],
      }
    case 'PUSH_SNAPSHOT':
      // Cap the undo depth to keep memory bounded.
      return { ...state, past: [...state.past, snapshot(state)].slice(-24) }
    case 'UNDO': {
      if (state.past.length === 0) return state
      const past = [...state.past]
      const snap = past.pop() as MenloSnapshot
      return { ...restoreSnapshot(state, snap), past }
    }
    case 'SET_OPPORTUNITY':
      return { ...state, opportunity: action.opportunity }
    case 'SET_LEAKAGE':
      return { ...state, leakage: action.leakage }
    case 'SET_PRIORITY':
      return { ...state, priority: action.priority }
    case 'SET_RISK':
      return { ...state, risk: action.risk }
    case 'SET_COMMUNICATION':
      return { ...state, communication: action.communication }
    case 'SET_PERFORMANCE':
      return { ...state, performance: action.performance }
    case 'SET_CUSTOMER':
      return { ...state, selectedCustomer: action.customer }
    case 'SET_WHATSAPP':
      return { ...state, whatsapp: action.whatsapp }
    case 'SET_SIMULATION':
      return { ...state, simulation: action.simulation }
    case 'SELECT_SCENARIO':
      return state.simulation
        ? { ...state, simulation: { ...state.simulation, selectedChannel: action.channel } }
        : state
    case 'SET_APPROVAL':
      return { ...state, approval: action.approval }
    case 'SET_EXECUTION':
      return { ...state, execution: action.execution }
    case 'UPDATE_EXECUTION':
      return state.execution
        ? { ...state, execution: { ...state.execution, ...action.patch } }
        : state
    case 'SET_OUTCOME':
      return { ...state, outcome: action.outcome }
    case 'SET_LEARNING':
      return { ...state, learning: action.learning }
    case 'SET_METRIC':
      return { ...state, metric: action.metric }
    case 'SET_COMPARISON':
      return { ...state, comparison: action.comparison }
    case 'SET_EXPLANATION':
      return { ...state, explanation: action.explanation }
    case 'SET_CUSTOMER_TABLE':
      return { ...state, customerTable: action.table }
    case 'SET_CANVAS':
      return { ...state, canvas: action.canvas }
    case 'RESET':
      return { ...initialState }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface MenloContextValue {
  state: MenloState
  dispatch: React.Dispatch<Action>
  registerTool: (tool: FrontendTool) => () => void
  callTool: (name: string, args?: Record<string, unknown>) => Promise<void>
  listTools: () => FrontendTool[]
  runAgent: (text: string) => Promise<void>
}

const MenloContext = createContext<MenloContextValue | null>(null)

function buildContext(s: MenloState): AgentContext {
  let lastArtifactType: ArtifactType | null = null
  for (let i = s.timeline.length - 1; i >= 0; i--) {
    const item = s.timeline[i]
    if (item.kind === 'artifact') {
      lastArtifactType = item.artifact.type
      break
    }
  }
  return {
    hasOpportunity: !!s.opportunity,
    hasSimulation: !!s.simulation,
    hasApproval: !!s.approval,
    approvalApproved: false,
    hasExecution: !!s.execution,
    hasOutcome: !!s.outcome,
    hasComparison: !!s.comparison,
    hasCommunication: !!s.communication,
    hasPerformance: !!s.performance,
    hasPriority: !!s.priority,
    hasRisk: !!s.risk,
    hasLeakage: !!s.leakage,
    hasCanvas: !!s.canvas,
    selectedChannel: s.shared.selectedChannel,
    selectedSegment: s.shared.selectedSegment,
    filterSegment: s.shared.filterSegment,
    conversion: s.shared.conversion,
    lastArtifactType,
    canUndo: s.past.length > 0,
  }
}

export function MenloProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const toolsRef = useRef<Map<string, FrontendTool>>(new Map())
  const busyRef = useRef(false)

  const stateRef = useRef(state)
  stateRef.current = state

  const registerTool = useCallback((tool: FrontendTool) => {
    toolsRef.current.set(tool.name, tool)
    return () => {
      toolsRef.current.delete(tool.name)
    }
  }, [])

  const callTool = useCallback(async (name: string, args: Record<string, unknown> = {}) => {
    const tool = toolsRef.current.get(name)
    if (!tool) {
      console.log('[v0] Menlo tool not found:', name)
      return
    }
    console.log('[v0] Menlo tool invoked:', name, args)
    await tool.handler(args)
  }, [])

  const listTools = useCallback(() => Array.from(toolsRef.current.values()), [])

  const runAgent = useCallback(
    async (text: string) => {
      if (busyRef.current) return
      busyRef.current = true

      // 1) The user's message enters the thread + operational memory.
      dispatch({ type: 'APPEND_MESSAGE', role: 'user', content: text })
      dispatch({ type: 'APPEND_EVENT', event: { actor: 'user', action: 'Perguntou', detail: text } })
      dispatch({ type: 'SET_THINKING', thinking: true })
      dispatch({ type: 'SET_HIGHLIGHT', id: null })
      dispatch({ type: 'SET_SUGGESTIONS', suggestions: [] })

      // 2) Plan a single turn from the message + live context.
      const ctx = buildContext(stateRef.current)
      const turn = planTurn(text, ctx)
      if (turn.intent) dispatch({ type: 'SET_INTENT', intent: turn.intent })

      // 3) Snapshot data for undo BEFORE anything mutates (reset/undo excepted).
      if (turn.operation !== 'undo' && turn.operation !== 'reset') {
        dispatch({ type: 'PUSH_SNAPSHOT' })
      }

      // 4) Undo is resolved by the store, not a tool.
      if (turn.operation === 'undo') {
        if (ctx.canUndo) dispatch({ type: 'UNDO' })
      }

      // 5) Subtle, progressive activity — never chain-of-thought.
      for (const step of turn.activity) {
        dispatch({ type: 'SET_AGENT_STATUS', status: step })
        await sleep(560)
      }
      dispatch({ type: 'SET_AGENT_STATUS', status: null })

      // 6) Menlo speaks, then composes / mutates an artifact via a tool.
      dispatch({ type: 'APPEND_MESSAGE', role: 'menlo', content: turn.message })
      dispatch({
        type: 'APPEND_EVENT',
        event: { actor: 'menlo', action: labelForOperation(turn.operation), detail: turn.message },
      })
      await sleep(140)
      if (turn.toolName) await callTool(turn.toolName, turn.toolArgs ?? {})

      // 7) Contextual next steps + optional human-in-the-loop interrupt.
      dispatch({ type: 'SET_SUGGESTIONS', suggestions: turn.suggestions })
      dispatch({ type: 'SET_PENDING_INPUT', pending: turn.requiresInput ?? null })

      dispatch({ type: 'SET_THINKING', thinking: false })
      busyRef.current = false
    },
    [callTool],
  )

  const value = useMemo<MenloContextValue>(
    () => ({ state, dispatch, registerTool, callTool, listTools, runAgent }),
    [state, registerTool, callTool, listTools, runAgent],
  )

  return <MenloContext.Provider value={value}>{children}</MenloContext.Provider>
}

export function useMenlo() {
  const ctx = useContext(MenloContext)
  if (!ctx) throw new Error('useMenlo must be used within MenloProvider')
  return ctx
}

// A short pt-BR label for the operational-memory event of each operation.
function labelForOperation(op: string): string {
  const map: Record<string, string> = {
    workspace: 'Compôs workspace',
    quantify: 'Respondeu métrica',
    compare: 'Comparou opções',
    strategy: 'Propôs estratégia',
    simulate: 'Simulou',
    adjust: 'Ajustou parâmetros',
    filter: 'Filtrou',
    drilldown: 'Detalhou clientes',
    explain: 'Explicou decisão',
    channel_pick: 'Selecionou canal',
    recommend: 'Recomendou alocação',
    worst_case: 'Analisou risco',
    approve: 'Preparou aprovação',
    execute: 'Executou',
    outcome: 'Consolidou resultado',
    communication: 'Reportou comunicação',
    performance: 'Reportou desempenho',
    history: 'Abriu histórico',
    learning: 'Consolidou aprendizado',
    undo: 'Desfez',
    reset: 'Reiniciou',
  }
  return map[op] ?? 'Respondeu'
}

// ---------------------------------------------------------------------------

export function useFrontendTool(tool: FrontendTool) {
  const { registerTool } = useMenlo()
  const handlerRef = useRef(tool.handler)
  handlerRef.current = tool.handler

  useEffect(() => {
    const unregister = registerTool({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      handler: (args) => handlerRef.current(args),
    })
    return unregister
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.name, tool.description, registerTool])
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

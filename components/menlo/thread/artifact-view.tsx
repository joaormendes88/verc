'use client'

import type { ArtifactType } from '@/lib/menlo/types'
import { OpportunitySurface } from '@/components/menlo/surfaces/opportunity-surface'
import { PaymentLeakageSurface } from '@/components/menlo/surfaces/payment-leakage-surface'
import { PrioritySegmentSurface } from '@/components/menlo/surfaces/priority-segment-surface'
import { CustomerRiskSurface } from '@/components/menlo/surfaces/customer-risk-surface'
import { CustomerDetailSurface } from '@/components/menlo/surfaces/customer-detail-surface'
import { WhatsappSurface } from '@/components/menlo/surfaces/whatsapp-surface'
import { SimulationSurface } from '@/components/menlo/surfaces/simulation-surface'
import { ApprovalSurface } from '@/components/menlo/surfaces/approval-surface'
import { ExecutionSurface } from '@/components/menlo/surfaces/execution-surface'
import { OutcomeSurface } from '@/components/menlo/surfaces/outcome-surface'
import { LearningSurface } from '@/components/menlo/surfaces/learning-surface'
import { CommunicationSurface } from '@/components/menlo/surfaces/communication-surface'
import { AgentPerformanceSurface } from '@/components/menlo/surfaces/agent-performance-surface'
import { DecisionHistorySurface } from '@/components/menlo/surfaces/decision-history-surface'
import { MetricSurface } from '@/components/menlo/surfaces/metric-surface'
import { ComparisonSurface } from '@/components/menlo/surfaces/comparison-surface'
import { ExplanationSurface } from '@/components/menlo/surfaces/explanation-surface'
import { CustomerTableSurface } from '@/components/menlo/surfaces/customer-table-surface'
import { DecisionCanvasSurface } from '@/components/menlo/surfaces/decision-canvas-surface'

// Each artifact embeds one of the existing financial surfaces as its body.
// The surfaces read their data from live state singletons — unchanged from the
// standalone-workspace era — so the visual identity is exactly preserved.
export function ArtifactView({ type }: { type: ArtifactType }) {
  switch (type) {
    case 'opportunity':
      return <OpportunitySurface />
    case 'payment-leakage':
      return <PaymentLeakageSurface />
    case 'segment-priority':
      return <PrioritySegmentSurface />
    case 'customer-risk':
      return <CustomerRiskSurface />
    case 'customer-detail':
      return <CustomerDetailSurface />
    case 'whatsapp':
      return <WhatsappSurface />
    case 'simulation':
      return <SimulationSurface />
    case 'approval':
      return <ApprovalSurface />
    case 'execution':
      return <ExecutionSurface />
    case 'outcome':
      return <OutcomeSurface />
    case 'learning':
      return <LearningSurface />
    case 'communication':
      return <CommunicationSurface />
    case 'agent-performance':
      return <AgentPerformanceSurface />
    case 'decision-history':
      return <DecisionHistorySurface />
    case 'metric':
      return <MetricSurface />
    case 'comparison':
      return <ComparisonSurface />
    case 'explanation':
      return <ExplanationSurface />
    case 'customer-table':
      return <CustomerTableSurface />
    case 'decision-canvas':
      return <DecisionCanvasSurface />
    default:
      return null
  }
}

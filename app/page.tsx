import { MenloProvider } from '@/lib/menlo/store'
import { MenloAgentTools } from '@/components/menlo/agent-tools'
import { Workspace } from '@/components/menlo/workspace'

export default function Page() {
  return (
    <MenloProvider>
      {/* Controlled registry of semantic frontend tools the agent can invoke. */}
      <MenloAgentTools />
      <Workspace />
    </MenloProvider>
  )
}

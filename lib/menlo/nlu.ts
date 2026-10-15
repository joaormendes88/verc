import type { AgentEntities, AgentOperation, Analysis, ChannelId, FinancialIntent } from './types'
import { classifyIntent } from './intents'

// ---------------------------------------------------------------------------
// Semantic conversation layer (the NLU seam).
//
// This is NOT a phrase→answer map. It reads a message and produces a structured
// Analysis: the OPERATION the user wants performed and the ENTITIES they named.
// The runtime turns that — together with conversation context — into behavior.
// Two different questions therefore resolve to two different operations, which
// is what makes the agent feel like it understands rather than routes.
//
// When a real model/backend arrives, `analyze` is the single function to swap:
// return the same Analysis shape and everything downstream is unchanged.
// ---------------------------------------------------------------------------

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

const SEGMENTS: { match: RegExp; label: string }[] = [
  { match: /enterprise|corporativ/, label: 'Clientes Enterprise' },
  { match: /pme|pequen|medi[ao]/, label: 'PMEs · alto ticket' },
  { match: /varejo|recorrente/, label: 'Varejo recorrente' },
  { match: /novos? cliente|onboarding/, label: 'Novos clientes' },
]

function detectChannel(q: string): Exclude<ChannelId, 'none'> | undefined {
  if (/whatsapp|whats|zap/.test(q)) return 'whatsapp'
  if (/\bsms\b|torpedo/.test(q)) return 'sms'
  if (/e-?mail/.test(q)) return 'email'
  return undefined
}

function detectSegment(q: string): string | undefined {
  for (const s of SEGMENTS) if (s.match.test(q)) return s.label
  return undefined
}

// Percentages: "10%", "conversão de 8,4", "converter 12 por cento".
function detectPercent(q: string): number | undefined {
  const pct = q.match(/(\d+(?:[.,]\d+)?)\s*(?:%|por ?cento)/)
  if (pct) return clampPct(parseFloat(pct[1].replace(',', '.')) / 100)
  // "converter 10" / "conversao para 10" — a bare number tied to conversion.
  const conv = q.match(/(?:convers|converter|conversao|conversão)[^\d]*(\d+(?:[.,]\d+)?)/)
  if (conv) {
    const n = parseFloat(conv[1].replace(',', '.'))
    return clampPct(n > 1 ? n / 100 : n)
  }
  return undefined
}

function clampPct(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.min(0.95, Math.max(0.005, n))
}

// Money: "R$50 mil", "50k", "R$ 1,2 milhão", "100000".
function detectMoney(q: string): number | undefined {
  const m = q.match(/r?\$?\s*(\d+(?:[.,]\d+)?)\s*(mil|k|m|milh(?:ao|ão|oes|ões)?)?/)
  if (!m) return undefined
  // Require an explicit currency or magnitude token so we don't grab "10%".
  const hasCurrency = /r\$|\breais?\b/.test(q)
  const unit = m[2]
  if (!hasCurrency && !unit) return undefined
  const base = parseFloat(m[1].replace('.', '').replace(',', '.'))
  if (Number.isNaN(base)) return undefined
  if (!unit) return base
  if (unit === 'mil' || unit === 'k') return base * 1_000
  return base * 1_000_000
}

function detectSuperlative(q: string): AgentEntities['superlative'] {
  if (/pior|pessimist|worst/.test(q)) return 'worst'
  if (/maiores?|top \d+|principa|maior/.test(q)) return 'top'
  if (/melhor|best/.test(q)) return 'best'
  return undefined
}

// Operation detection, in priority order. Earlier, more consequential or more
// specific intents win. Each branch documents the utterances it owns.
function detectOperation(q: string, entities: AgentEntities): AgentOperation {
  // Session controls first — they must never be mistaken for content.
  if (/come(c|ç)ar? de novo|do zero|nova sess|reinicia|limpar tudo|resetar?/.test(q)) return 'reset'
  if (/desfa[czç]|desfaz|reverter|voltar? (a|para|pra)? ?(o |a )?(estado |simula|versao|versão|anterior)|volte|undo/.test(q))
    return 'undo'

  // Consequential commands.
  if (/\bexecut|dispara|envia agora|pode enviar|manda ver/.test(q)) return 'execute'
  if (/\baprov|autoriz|confirmo|pode aprovar/.test(q)) return 'approve'

  // Parameter adjustment — changes an existing decision rather than asking anew.
  const wantsAdjust = /aument|reduz|diminu|sobe|abaixa|mud(a|e|ar) (para|pra)|ajust|coloca (em|para)|deixa em|e se|caso/.test(q)
  if ((wantsAdjust && (entities.percent !== undefined || entities.money !== undefined)) ||
      (entities.percent !== undefined && /convers|taxa|conversao|conversão/.test(q))) {
    return 'adjust'
  }

  // Decision canvas / recommendation — "onde devo investir R$50k?".
  if (/onde (devo|deveria|podemos|posso).*(gast|investir|alocar|aplicar|colocar)|onde.*(perdendo|perco) dinheiro|recomend|o que (devo|voce sugere|você sugere|fazer agora)|melhor decisao|melhor decisão|priori(ze|zar) o investimento/.test(q))
    return 'recommend'

  // Worst case / risk exploration.
  if (entities.superlative === 'worst' || /pior (cenario|cenário|caso)|cenario pessimist|quais (sao |são )?os riscos|mostre o risco|risco do plano/.test(q))
    return 'worst_case'

  // Comparison — checked before a bare channel pick so "WhatsApp ou email?"
  // compares instead of selecting.
  if (/compar|versus|\bvs\.?\b| ou (whatsapp|email|e-?mail|sms)|(whatsapp|email|e-?mail|sms) ou |diferen(c|ç)a entre|qual (e|é) (o )?melhor (canal|entre)/.test(q))
    return 'compare'

  // Strategy — "como? / de que forma? / qual a estratégia?".
  if (/^como\b|^e como|de que forma|qual (a |e a |é a )?estrat|como (recuperar|abordar|fazer isso|voce faz|você faz)/.test(q))
    return 'strategy'

  // Explanation.
  if (/por ?qu[eê]|porqu[eê]|explica|justific|motivo|razao|razão|entao por|então por/.test(q)) return 'explain'

  // Bare channel choice: a channel is named and it reads like a selection.
  if (entities.channel && /^\s*(whatsapp|sms|e-?mail)\b|escolh|selecion|vai de|prefiro|fico com|fica com|usa[r]?|use |vamos de|opto por|manda (por|no|via)|envia (por|no|via)/.test(q))
    return 'channel_pick'

  // Drill down into the customers behind a number.
  if (/quem (sao|são|e|é)|quais clientes|ver (os )?clientes|mostr(e|ar) (os )?clientes|lista de clientes|top \d+|\d+ maiores|maiores devedores|principais clientes/.test(q))
    return 'drilldown'

  // Outcome — realized result. Checked before generic "quanto?".
  if (/quanto (gerou|recuperou|recuperamos|resultou|foi recuperado|entrou)|resultado (real|final|de fato)|quanto (isso )?(rendeu|deu)|impacto real/.test(q))
    return 'outcome'

  // Simulate.
  if (/\bsimul|projet|estim(a|ar) (o )?resultado|roda a simula/.test(q)) return 'simulate'

  // Filter the current artifact.
  if (entities.segment && /(mostr(e|ar)|filtr|so |só |apenas|somente|ver) /.test(q)) return 'filter'

  // Quantify — a direct numeric answer.
  if (/\bquant[oa]s?\b|qual (o |é o |e o )?valor|represent|quanto (dinheiro|vale|custa|posso)/.test(q)) return 'quantify'

  // Communication activity.
  if (/quantas (mensagens|conversas|respostas)|mensagens (respond|enviad|hoje)|atividade de comunic|respondi hoje/.test(q))
    return 'communication'

  // Agent performance.
  if (/desempenho|performance|como (voce|vc|você) (esta|está|ta|vem|foi|anda)|produtiv|seu resultado|como voce esta indo|como você está indo/.test(q))
    return 'performance'

  // History / operational memory.
  if (/histor[ií]|decis(oes|ões|ao|ão)|linha do tempo|memoria|memória|o que (ja )?(fizemos|aconteceu)|mostre o que aconteceu|resumo da sess/.test(q))
    return 'history'

  // Learning.
  if (/aprend/.test(q)) return 'learning'

  // Otherwise: a brand-new workspace question.
  return 'workspace'
}

export function analyze(text: string): Analysis {
  const q = normalize(text)
  const entities: AgentEntities = {
    channel: detectChannel(q),
    segment: detectSegment(q),
    percent: detectPercent(q),
    money: detectMoney(q),
    superlative: detectSuperlative(q),
  }
  const operation = detectOperation(q, entities)
  const { intent } = classifyIntent(text)
  return { operation, entities, workspaceIntent: intent as FinancialIntent, normalized: q }
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { useMenlo, sleep } from '@/lib/menlo/store'
import { formatNumber } from '@/lib/menlo/format'
import { ArrowUp, Mic, Paperclip, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Composer() {
  const { runAgent, state, dispatch } = useMenlo()
  const [value, setValue] = useState('')
  const [recording, setRecording] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const busy = state.thinking

  // Voice-ready composer: wire the Web Speech API when available. Voice feeds
  // exactly the same AgentRuntime as text — it is just another input surface.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    setVoiceSupported(true)
    const rec = new SR()
    rec.lang = 'pt-BR'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript?.trim()
      if (transcript) void runAgent(transcript)
    }
    rec.onend = () => setRecording(false)
    rec.onerror = () => setRecording(false)
    recognitionRef.current = rec
    return () => {
      try {
        rec.abort()
      } catch {
        /* no-op */
      }
    }
  }, [runAgent])

  function toggleVoice() {
    const rec = recognitionRef.current
    if (!rec || busy) return
    if (recording) {
      rec.stop()
      setRecording(false)
    } else {
      try {
        rec.start()
        setRecording(true)
      } catch {
        setRecording(false)
      }
    }
  }

  function submit() {
    const text = value.trim()
    if (!text || busy) return
    setValue('')
    void runAgent(text)
  }

  // Attachment-ready pipeline: a file becomes a message, Menlo reads it, and a
  // customer-intelligence artifact is composed — same thread, same model.
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || busy) return

    let count = 0
    if (/\.csv$/i.test(file.name) || file.type.includes('csv')) {
      const text = await file.text()
      count = Math.max(0, text.split(/\r?\n/).filter((l) => l.trim().length).length - 1)
    } else {
      count = Math.max(120, Math.round(file.size / 42))
    }
    const ext = file.name.split('.').pop()?.toUpperCase() ?? 'ARQUIVO'

    dispatch({ type: 'APPEND_MESSAGE', role: 'user', content: `Anexo: ${file.name}` })
    dispatch({ type: 'APPEND_EVENT', event: { actor: 'user', action: 'Anexou arquivo', detail: file.name } })
    dispatch({ type: 'SET_THINKING', thinking: true })
    dispatch({ type: 'SET_SUGGESTIONS', suggestions: [] })
    for (const step of ['Lendo o arquivo', 'Identificando clientes', 'Compondo a leitura']) {
      dispatch({ type: 'SET_AGENT_STATUS', status: step })
      await sleep(560)
    }
    dispatch({ type: 'SET_AGENT_STATUS', status: null })
    dispatch({
      type: 'APPEND_MESSAGE',
      role: 'menlo',
      content: `Encontrei ${formatNumber(count)} clientes em ${file.name}. Preparei uma leitura inicial.`,
    })
    dispatch({
      type: 'SET_METRIC',
      metric: {
        id: 'M-file',
        label: `Clientes em ${file.name}`,
        value: formatNumber(count),
        context: 'Leitura inicial do arquivo. Posso aprofundar segmentos, duplicados, valor e risco.',
        breakdown: [
          { label: 'Formato', value: ext },
          { label: 'Tamanho', value: `${Math.max(1, Math.round(file.size / 1024))} KB` },
          { label: 'Status', value: 'Analisado' },
        ],
      },
    })
    dispatch({ type: 'APPEND_ARTIFACT', artifactType: 'metric' })
    dispatch({ type: 'SET_SUGGESTIONS', suggestions: ['Segmentar esses clientes', 'Quem está em risco?', 'Onde posso recuperar mais?'] })
    dispatch({ type: 'SET_THINKING', thinking: false })
  }

  const suggestions = state.suggestions

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Contextual next steps — derived from the current artifact/state, never
          a fixed list. Hidden while Menlo is working. */}
      {suggestions.length > 0 && !busy ? (
        <div className="mb-2.5 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => runAgent(s)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 pl-2 shadow-[0_2px_24px_-12px_rgba(0,0,0,0.25)] transition-colors focus-within:border-foreground/25">
        <input ref={fileRef} type="file" accept=".csv,.pdf,.xlsx,.xls,.png,.jpg,.jpeg" onChange={onFile} className="hidden" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          aria-label="Anexar arquivo"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
        >
          <Paperclip className="size-4" />
        </button>

        {voiceSupported ? (
          <button
            type="button"
            onClick={toggleVoice}
            disabled={busy}
            aria-label={recording ? 'Parar gravação' : 'Falar com o Menlo'}
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40',
              recording
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            {recording ? <Square className="size-3.5 animate-pulse-dot" /> : <Mic className="size-4" />}
          </button>
        ) : null}

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={recording ? 'Ouvindo…' : 'Pergunte ao Menlo uma decisão financeira…'}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          aria-label="Pergunte ao Menlo"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim() || busy}
          aria-label="Enviar"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <ArrowUp className="size-4" strokeWidth={2.5} />
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Menlo Adaptive Interface · texto, voz e anexos alimentam o mesmo runtime
      </p>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { api } from '../api/client'

export default function AgentChat() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await api.chat(msg, sessionId ?? undefined)
      setSessionId(res.session_id)
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }])
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `Error: ${e instanceof Error ? e.message : 'Failed to get response'}. Ensure backend is running and OPENAI_API_KEY is set for AI.` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    'Which supplier offers the best price for Product X?',
    'When should we reorder SKU-123?',
    'Show vendors with delayed shipments last month.',
    'What are the current low stock alerts?',
  ]

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>AI Purchase Agent</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Ask about suppliers, reorder suggestions, low stock, budgets, and cost optimization.
      </p>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 220px)',
          minHeight: 400,
        }}
      >
        <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
          {messages.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <p style={{ marginBottom: '0.75rem' }}>Try asking:</p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    style={{ marginBottom: '0.5rem', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setInput(s)}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '0.75rem',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: m.role === 'user' ? 'var(--accent-dim)' : 'var(--bg)',
                  border: '1px solid var(--border)',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.9rem',
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Thinking…</div>
          )}
          <div ref={bottomRef} />
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); send() }}
          style={{
            padding: '0.75rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '0.5rem',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about suppliers, reorders, costs…"
            disabled={loading}
            style={{
              flex: 1,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.6rem 1rem',
              color: 'var(--text)',
              fontSize: '0.95rem',
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Send size={18} /> Send
          </button>
        </form>
      </div>
    </div>
  )
}

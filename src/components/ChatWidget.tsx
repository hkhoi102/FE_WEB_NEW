import { useEffect, useMemo, useRef, useState } from 'react'


interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  content: string
  quickActions?: Array<{ text: string }>
}

const CHAT_API_BASE = (import.meta as any).env?.VITE_CHATBOX_API_BASE || '/api/chatbox'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const chatRef = useRef<HTMLDivElement | null>(null)

  // Session id persisted per browser
  const sessionId = useMemo(() => {
    let sid = localStorage.getItem('chatbox_session_id')
    if (!sid) {
      sid = `web-session-${Date.now()}`
      localStorage.setItem('chatbox_session_id', sid)
    }
    return sid
  }, [])

  const customerId = useMemo(() => {
    // If you have real user id, map here. Fallback demo id 1
    const raw = localStorage.getItem('user_info')
    try {
      if (raw) {
        const u = JSON.parse(raw)
        if (u?.id) return Number(u.id)
      }
    } catch {}
    return 1
  }, [])

  useEffect(() => {
    // Seed welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          content:
            'Xin chào! Tôi có thể giúp bạn tìm kiếm và đặt hàng.',
        },
      ])
    }
  }, [])

  useEffect(() => {
    // Auto scroll to bottom
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, isOpen])

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isSending) return

    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-u`, sender: 'user', content: msg },
    ])
    setInput('')
    setIsSending(true)

    try {
      const res = await fetch(`${CHAT_API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, sessionId, customerId }),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}${text ? ` - ${text}` : ''}`)
      }
      const data = await res.json()
      const botMsg: ChatMessage = {
        id: `${Date.now()}-b`,
        sender: 'bot',
        content: data?.message || 'Mình đã nhận được tin nhắn của bạn.',
        quickActions: Array.isArray(data?.quickActions) ? data.quickActions : undefined,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-e`, sender: 'bot', content: `Xin lỗi, có lỗi xảy ra. ${e?.message || ''}` },
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg bg-primary-600 hover:bg-primary-700 text-white w-14 h-14 flex items-center justify-center"
        aria-label="Mở chat hỗ trợ"
      >
        {isOpen ? (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        ) : (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h8M8 14h5M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l.8-4A8.9 8.9 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[95vw] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Chat hỗ trợ</h3>
                <p className="text-xs text-indigo-100">Hỏi tôi về sản phẩm và đặt hàng</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="opacity-90 hover:opacity-100">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div ref={chatRef} className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${m.sender === 'user' ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'}`}>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  {m.quickActions && m.quickActions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.quickActions.map((qa, idx) => (
                        <button
                          key={idx}
                          className="text-xs px-2 py-1 rounded-full border border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors"
                          onClick={() => sendMessage(qa.text)}
                        >
                          {qa.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
            <input
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
              disabled={isSending}
            />
            <button
              className="px-4 py-2 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              onClick={() => sendMessage()}
              disabled={isSending || !input.trim()}
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatWidget



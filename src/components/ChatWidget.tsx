import { useEffect, useMemo, useRef, useState } from 'react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  route?: 'sql' | 'rag' | 'quota_error' | null
  timestamp: Date
  isQuotaError?: boolean
}

// Use /api/ai-chat for production (via Vercel proxy to http://103.229.52.246:8000)
// For local dev, set VITE_AI_CHAT_API_URL=http://localhost:8000 in .env
const API_URL = import.meta.env.VITE_AI_CHAT_API_URL || '/api/ai-chat'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showTyping, setShowTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  // User ID persisted per browser
  const userId = useMemo(() => {
    let uid = localStorage.getItem('ai_chat_user_id')
    if (!uid) {
      uid = `user_${Date.now()}`
      localStorage.setItem('ai_chat_user_id', uid)
    }
    return uid
  }, [])

  // Conversation history for API
  const conversationHistory = useMemo(() => {
    return messages
      .filter((m) => !m.isQuotaError && m.route !== 'quota_error')
      .map((m) => ({
        role: m.role,
        content: m.content,
      }))
  }, [messages])

  useEffect(() => {
    // Auto scroll to bottom
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, showTyping, isOpen])

  // Auto resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  // Markdown to HTML converter (basic)
  const markdownToHtml = (text: string): string => {
    // Convert **text** to <strong>text</strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert line breaks to <br>
    text = text.replace(/\n/g, '<br>')
    return text
  }

  // Format time
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Add message
  const addMessage = (
    role: 'user' | 'assistant',
    content: string,
    route?: 'sql' | 'rag' | 'quota_error' | null,
    isQuotaError = false
  ) => {
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${role}`,
      role,
      content,
      route: route || null,
      timestamp: new Date(),
      isQuotaError,
    }
    setMessages((prev) => [...prev, newMessage])
  }

  // Clear chat
  const clearChat = () => {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ lịch sử chat?')) {
      return
    }
    setMessages([])
    setError(null)
    // Clear on server
    fetch(`${API_URL}/conversation/${userId}`, {
      method: 'DELETE',
    }).catch((err) => console.error('Failed to clear server history:', err))
  }

  // Send message
  const sendMessage = async (text?: string) => {
    const question = (text ?? input).trim()
    if (!question || isSending) return

    // Add user message
    addMessage('user', question)
    setInput('')
    setError(null)
    setIsSending(true)
    setShowTyping(true)

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          user_id: userId,
          top_k: 4,
          conversation_history: conversationHistory,
        }),
      })

      setShowTyping(false)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP ${response.status}`)
      }

      const data = await response.json()

      // Check if it's a quota error
      const isQuotaError = data.route === 'quota_error' || data.error === 'quota_exceeded'

      // Add assistant message
      addMessage('assistant', data.answer || 'Mình đã nhận được câu hỏi của bạn.', data.route, isQuotaError)

      // If quota error and has retry_after, log it
      if (isQuotaError && data.retry_after) {
        const retrySeconds = parseFloat(data.retry_after)
        if (retrySeconds > 0) {
          console.log(`Quota exceeded. Retry after ${retrySeconds} seconds.`)
        }
      }
    } catch (e: any) {
      setShowTyping(false)
      console.error('Error:', e)

      let errorMessage = 'Không thể kết nối đến server. '
      if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
        errorMessage += 'Vui lòng kiểm tra xem AI service đã chạy chưa.'
      } else {
        errorMessage += e.message
      }

      setError(errorMessage)
      addMessage('assistant', `❌ Lỗi: ${errorMessage}`)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const hasMessages = messages.length > 0

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white w-14 h-14 flex items-center justify-center transition-all duration-200 hover:scale-110"
        aria-label="Mở chat hỗ trợ AI"
      >
        {isOpen ? (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h8M8 14h5M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l.8-4A8.9 8.9 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[500px] max-w-[95vw] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  🤖 Smart Retail AI Assistant
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-xs text-indigo-100">Đang hoạt động</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="opacity-90 hover:opacity-100 text-xs px-3 py-1.5 bg-white/20 rounded-lg transition-colors"
                  title="Xóa lịch sử"
                >
                  Xóa
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="opacity-90 hover:opacity-100"
                  aria-label="Đóng chat"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {!hasMessages && (
              <div className="text-center py-10 text-gray-600">
                <h2 className="text-2xl font-semibold mb-2 text-gray-800">👋 Chào mừng!</h2>
                <p className="text-sm mb-4">Tôi là trợ lý AI cho hệ thống siêu thị. Bạn có thể hỏi tôi về:</p>
                <ul className="text-sm space-y-1 text-left max-w-xs mx-auto">
                  <li>• Sản phẩm, giá cả, tồn kho</li>
                  <li>• Thống kê doanh số, đơn hàng</li>
                  <li>• Chính sách và hướng dẫn</li>
                </ul>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className="max-w-[75%]">
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-sm'
                        : m.isQuotaError
                          ? 'bg-orange-50 border-2 border-orange-300 text-orange-900 rounded-bl-sm'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <div
                      className="whitespace-pre-wrap break-words text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: markdownToHtml(m.content) }}
                    />
                    {m.route && (
                      <div className="mt-2">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${
                            m.route === 'sql'
                              ? 'bg-blue-100 text-blue-700'
                              : m.route === 'rag'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {m.route === 'quota_error' ? 'QUOTA EXCEEDED' : m.route.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    className={`text-[11px] text-gray-500 mt-1 px-1 ${
                      m.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {formatTime(m.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {showTyping && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded text-sm">
                ❌ {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-500 transition-colors max-h-[120px]"
                placeholder="Nhập câu hỏi của bạn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                rows={1}
              />
              <button
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none min-w-[80px]"
                onClick={() => sendMessage()}
                disabled={isSending || !input.trim()}
              >
                {isSending ? 'Đang gửi...' : 'Gửi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </>
  )
}

export default ChatWidget



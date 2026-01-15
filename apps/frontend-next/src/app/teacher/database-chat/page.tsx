"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'

const navLinks: Array<{ href: Route; label: string; icon: string }> = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/teacher/attendance', label: 'Attendance', icon: '✅' },
  { href: '/teacher/analytics', label: 'Analytics', icon: '📈' },
  { href: '/teacher/assignments', label: 'Assignments', icon: '📚' },
  { href: '/teacher/diary', label: 'Digital Diary', icon: '📔' },
  { href: '/teacher/database-chat', label: 'Database Chat', icon: '💬' },
]

interface Message {
  type: 'user' | 'assistant' | 'error'
  content: string
  timestamp: Date
  intent?: string
  confidence?: number
}

export default function DatabaseChatPage() {
  const pathname = usePathname()
  const [question, setQuestion] = React.useState('')
  const [messages, setMessages] = React.useState<Message[]>([])
  const [loading, setLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendQuery = async () => {
    if (!question.trim() || loading) return

    const userMessage: Message = {
      type: 'user',
      content: question,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)
    setQuestion('')

    try {
      const response = await fetch('/api/database-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          question,
          role: 'teacher'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: data.answer,
          timestamp: new Date(),
          intent: data.intent,
          confidence: data.confidence
        }])
      } else {
        setMessages(prev => [...prev, {
          type: 'error',
          content: data.error || 'Failed to process query',
          timestamp: new Date()
        }])
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Network error. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendQuery()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const exampleQuestions = [
    "Show me attendance for my class today",
    "How many students are in CLASS 10-A?",
    "What's the timetable for tomorrow?",
    "Show me marks for student USN 2024001",
    "What's in the diary for CLASS 1 today?",
    "Show me calendar events this week",
    "List all circulars for CLASS 10",
    "What's the attendance percentage for CLASS 1 this month?",
    "Show me fee summary for CLASS 10",
    "What's the class performance in Mathematics?",
  ]

  return (
    <div className="page">
      {/* Modern Header */}
      <nav style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px'
        }}>
          <Link href="/teacher/dashboard" style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'white',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '24px' }}>🎓</span>
            School ERP
          </Link>
          <div style={{ display: 'flex', gap: '4px' }}>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  color: 'white',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: pathname === link.href ? 'rgba(255,255,255,0.2)' : 'transparent',
                  transition: 'all 0.2s',
                  border: pathname === link.href ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (pathname !== link.href) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== link.href) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>{link.icon}</span>
                <span className="nav-label">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {/* Header Section */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            💬 Database Chat Assistant
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0
          }}>
            Ask questions about student data, attendance, timetables, and more in natural language
          </p>
        </div>

        {/* Chat Container */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 280px)',
          minHeight: '500px'
        }}>
          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            background: '#f9fafb'
          }}>
            {messages.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{
                  fontSize: '64px',
                  marginBottom: '16px',
                  animation: 'float 3s ease-in-out infinite'
                }}>💬</div>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  color: '#111827'
                }}>
                  Start a conversation
                </h3>
                <p style={{ marginBottom: '24px', maxWidth: '500px' }}>
                  Ask me anything about your school data. I can help you with attendance, timetables, student information, and more.
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  width: '100%',
                  maxWidth: '600px'
                }}>
                  {exampleQuestions.slice(0, 4).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setQuestion(q)}
                      style={{
                        padding: '12px 16px',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '13px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: '#374151'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#667eea'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((message, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'slideIn 0.3s ease-out'
                  }}>
                    <div style={{
                      maxWidth: '75%',
                      padding: '14px 18px',
                      borderRadius: message.type === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: message.type === 'user'
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : message.type === 'error'
                        ? '#fee2e2'
                        : 'white',
                      color: message.type === 'user' ? 'white' : '#111827',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: message.type === 'error' ? '1px solid #fca5a5' : 'none'
                    }}>
                      <div style={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.6',
                        marginBottom: message.intent ? '8px' : '0'
                      }}>
                        {message.content}
                      </div>

                      {message.intent && (
                        <div style={{
                          marginTop: '8px',
                          padding: '4px 10px',
                          background: 'rgba(0,0,0,0.1)',
                          borderRadius: '12px',
                          fontSize: '11px',
                          display: 'inline-block',
                          fontWeight: 500
                        }}>
                          🎯 {message.intent} {message.confidence && `• ${Math.round(message.confidence * 100)}%`}
                        </div>
                      )}

                      <div style={{
                        fontSize: '10px',
                        opacity: 0.7,
                        marginTop: '6px',
                        textAlign: message.type === 'user' ? 'right' : 'left'
                      }}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {loading && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginTop: '16px',
                animation: 'slideIn 0.3s ease-out'
              }}>
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '16px 16px 16px 4px',
                  background: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#667eea',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#667eea',
                      animation: 'pulse 1.5s ease-in-out 0.2s infinite'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#667eea',
                      animation: 'pulse 1.5s ease-in-out 0.4s infinite'
                    }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{
            padding: '20px 24px',
            background: 'white',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your question here... (Press Enter to send)"
                  rows={1}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    resize: 'none',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'all 0.2s',
                    minHeight: '52px',
                    maxHeight: '120px'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
              <button
                onClick={sendQuery}
                disabled={!question.trim() || loading}
                style={{
                  padding: '14px 24px',
                  background: question.trim() && !loading
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#e5e7eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: question.trim() && !loading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '100px',
                  justifyContent: 'center',
                  height: '52px'
                }}
                onMouseEnter={(e) => {
                  if (question.trim() && !loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {loading ? '⏳' : '📤'} {loading ? 'Sending' : 'Send'}
              </button>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  style={{
                    padding: '14px 20px',
                    background: 'white',
                    color: '#6b7280',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    height: '52px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ef4444'
                    e.currentTarget.style.color = '#ef4444'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.color = '#6b7280'
                  }}
                >
                  🗑️
                </button>
              )}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#9ca3af',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>💡</span>
              <span>Press Enter to send • Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        @media (max-width: 768px) {
          .nav-label {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

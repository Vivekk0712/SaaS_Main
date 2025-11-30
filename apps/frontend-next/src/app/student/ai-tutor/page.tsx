'use client'
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'

export default function AITutorPage() {
  const pathname = usePathname()
  const [messages, setMessages] = React.useState<Array<{ role: 'user' | 'assistant'; content: string; sources?: any[] }>>([])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [documents, setDocuments] = React.useState<any[]>([])
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const student = React.useMemo(() => {
    try {
      const data = JSON.parse(sessionStorage.getItem('student') || '{}')
      // Use roll as student ID (or any unique identifier)
      return { ...data, id: data.roll || data.id || 1 }
    } catch {
      return { id: 1 } // Fallback to student ID 1 for testing
    }
  }, [])

  const loadDocuments = async () => {
    try {
      const res = await fetch(`/api/chatbot/documents?studentId=${student.id}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
    }
  }

  React.useEffect(() => {
    loadDocuments()
  }, [student.id])

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      alert('Please upload only PDF files')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('studentId', student.id)

    try {
      const res = await fetch('/api/chatbot/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        alert('PDF uploaded successfully! Processing...')
        loadDocuments()
      } else {
        const error = await res.json()
        alert(`Upload failed: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const res = await fetch(`/api/chatbot/documents?id=${docId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        alert('Document deleted successfully')
        loadDocuments()
      } else {
        alert('Failed to delete document')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete document')
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chatbot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          filters: { studentId: student.id },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer || 'No answer available',
            sources: data.sources || [],
          },
        ])
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
        ])
      }
    } catch (error) {
      console.error('Query error:', error)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = () => {
    if (confirm('Clear all chat history?')) {
      setMessages([])
    }
  }

  const navLinks: Array<{ href: Route; label: string; icon: string }> = [
    { href: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/student/progress', label: 'Progress', icon: '📊' },
    { href: '/student/attendance', label: 'Attendance', icon: '✅' },
    { href: '/student/diary', label: 'Diary', icon: '📔' },
    { href: '/student/calendar', label: 'Calendar', icon: '📅' },
    { href: '/student/circulars', label: 'Circulars', icon: '📣' },
    { href: '/student/syllabus', label: 'Syllabus', icon: '📚' },
    { href: '/student/ai-tutor', label: 'AI Tutor', icon: '🤖' },
  ]

  return (
    <div className="parent-shell">
      <div className="topbar topbar-parent">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>STUDENT</strong>
          </div>
          <nav className="tabs">
            {[0, 1, 2].map(i => (
              <button key={i} type="button" className="tab" style={{ pointerEvents: 'none', opacity: 0.4 }}>
                &nbsp;
              </button>
            ))}
          </nav>
          <div />
        </div>
      </div>

      <div className="dash-wrap parent-main">
        <div className="dash-layout">
          <aside className="side-nav side-nav-parent">
            {navLinks.map(link => {
              const active = pathname?.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`side-nav-link ${active ? 'side-nav-link-active' : ''}`}
                >
                  <span className="side-nav-icon">{link.icon}</span>
                  <span>{link.label.split(' ')[0]}</span>
                </Link>
              )
            })}
          </aside>

          <div className="dash">
            <div style={{ height: 6, width: 64, borderRadius: 999, background: '#3b2c1a', marginBottom: 10 }} />
            <h2 className="title">🤖 AI Tutor</h2>
            <p className="subtitle">Upload your study materials and ask questions</p>

            {/* Documents Section */}
            <section className="card" style={{ padding: 20, borderRadius: 8, marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>📚 My Documents</h3>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    className="btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ fontSize: 14 }}
                  >
                    {uploading ? '⏳ Uploading...' : '📤 Upload PDF'}
                  </button>
                </div>
              </div>

              {documents.length === 0 ? (
                <p className="note">No documents uploaded yet. Upload a PDF to get started!</p>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {documents.map(doc => (
                    <div
                      key={doc.id}
                      className="card"
                      style={{
                        padding: 12,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: 'none',
                        border: '1px solid var(--panel-border)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>📄 {doc.filename}</div>
                        <div className="note" style={{ fontSize: 12 }}>
                          {doc.upload_status === 'completed' ? '✅ Ready' : '⏳ Processing...'}
                        </div>
                      </div>
                      <button
                        className="btn-ghost"
                        onClick={() => handleDeleteDocument(doc.id)}
                        style={{ color: '#ef4444', fontSize: 12 }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Chat Section */}
            <section className="card" style={{ padding: 20, borderRadius: 8, marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>💬 Chat</h3>
                {messages.length > 0 && (
                  <button className="btn-ghost" onClick={handleClearChat} style={{ fontSize: 12 }}>
                    🗑️ Clear Chat
                  </button>
                )}
              </div>

              {/* Messages */}
              <div
                style={{
                  minHeight: 400,
                  maxHeight: 500,
                  overflowY: 'auto',
                  marginBottom: 16,
                  padding: 16,
                  background: 'var(--panel)',
                  borderRadius: 8,
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
                    <p className="note">Upload a PDF and start asking questions!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom: 16,
                        padding: 12,
                        borderRadius: 8,
                        background: msg.role === 'user' ? '#3b82f6' : '#f3f4f6',
                        color: msg.role === 'user' ? '#fff' : '#000',
                        marginLeft: msg.role === 'user' ? 'auto' : 0,
                        marginRight: msg.role === 'user' ? 0 : 'auto',
                        maxWidth: '80%',
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 12 }}>
                        {msg.role === 'user' ? '👤 You' : '🤖 AI Tutor'}
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 11, opacity: 0.8 }}>
                          📚 Sources: {msg.sources.length} document(s)
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question about your documents..."
                  disabled={loading || documents.length === 0}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--panel-border)',
                    fontSize: 14,
                  }}
                />
                <button
                  className="btn"
                  onClick={handleSendMessage}
                  disabled={loading || !input.trim() || documents.length === 0}
                  style={{ fontSize: 14, minWidth: 100 }}
                >
                  {loading ? '⏳ Thinking...' : '📤 Send'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

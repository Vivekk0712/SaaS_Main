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
  
  const [subjects, setSubjects] = React.useState<string[]>([])
  const [chapters, setChapters] = React.useState<any[]>([])
  const [subtopics, setSubtopics] = React.useState<any[]>([])
  
  const [selectedSubject, setSelectedSubject] = React.useState('')
  const [selectedChapter, setSelectedChapter] = React.useState('')
  const [selectedSubtopic, setSelectedSubtopic] = React.useState('')
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const student = React.useMemo(() => {
    try {
      const data = JSON.parse(sessionStorage.getItem('student') || '{}')
      return { 
        ...data, 
        id: data.roll || data.id || 1,
        klass: data.grade || data.klass || 'Class 10',
        section: data.section || 'A'
      }
    } catch {
      return { id: 1, klass: 'Class 10', section: 'A' }
    }
  }, [])

  React.useEffect(() => {
    const loadSubjects = async () => {
      try {
        const res = await fetch(`/api/mysql/academics/class-subjects?klass=${encodeURIComponent(student.klass)}&section=${encodeURIComponent(student.section)}`)
        if (res.ok) {
          const data = await res.json()
          setSubjects(data.items || [])
          if (data.items && data.items.length > 0) {
            setSelectedSubject(data.items[0])
          }
        }
      } catch (error) {
        console.error('Failed to load subjects:', error)
      }
    }
    loadSubjects()
  }, [student.klass, student.section])

  React.useEffect(() => {
    if (!selectedSubject) return
    
    const loadChapters = async () => {
      try {
        const raw = localStorage.getItem('school:syllabus')
        if (raw) {
          const syllabusData = JSON.parse(raw)
          const key = `${student.klass}|${student.section}|${selectedSubject.toLowerCase()}`
          const syllabus = syllabusData.find((s: any) => 
            `${s.klass}|${s.section}|${s.subject.toLowerCase()}` === key
          )
          if (syllabus && syllabus.chapters) {
            setChapters(syllabus.chapters)
            if (syllabus.chapters.length > 0) {
              setSelectedChapter(syllabus.chapters[0].id)
            }
          } else {
            setChapters([])
          }
        }
      } catch (error) {
        console.error('Failed to load chapters:', error)
      }
    }
    loadChapters()
  }, [selectedSubject, student.klass, student.section])

  React.useEffect(() => {
    if (!selectedChapter) return
    
    const chapter = chapters.find(c => c.id === selectedChapter)
    if (chapter && chapter.subtopics) {
      setSubtopics(chapter.subtopics)
      if (chapter.subtopics.length > 0) {
        setSelectedSubtopic(chapter.subtopics[0].id)
      }
    } else {
      setSubtopics([])
    }
  }, [selectedChapter, chapters])

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return
    if (!selectedSubject || !selectedChapter) {
      alert('Please select a subject and chapter first')
      return
    }

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
          filters: {
            klass: student.klass,
            section: student.section,
            subject: selectedSubject,
            chapterId: selectedChapter,
            subtopicId: selectedSubtopic || undefined,
          },
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
    { href: '/student/syllabus', label: 'Syllabus', icon: '📚' }
  ]

  const selectedChapterObj = chapters.find(c => c.id === selectedChapter)
  const selectedSubtopicObj = subtopics.find(s => s.id === selectedSubtopic)

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
            <p className="subtitle">Ask questions about your study materials uploaded by teachers</p>

            <section className="card" style={{ padding: 20, borderRadius: 8, marginTop: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>📚 Select Topic</h3>
              
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label className="label" style={{ fontSize: 13, marginBottom: 4 }}>Subject</label>
                  <select
                    className="input select"
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    {subjects.length === 0 ? (
                      <option>No subjects available</option>
                    ) : (
                      subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="label" style={{ fontSize: 13, marginBottom: 4 }}>Chapter</label>
                  <select
                    className="input select"
                    value={selectedChapter}
                    onChange={e => setSelectedChapter(e.target.value)}
                    disabled={chapters.length === 0}
                    style={{ width: '100%' }}
                  >
                    {chapters.length === 0 ? (
                      <option>No chapters available</option>
                    ) : (
                      chapters.map(chapter => (
                        <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
                      ))
                    )}
                  </select>
                </div>

                {subtopics.length > 0 && (
                  <div>
                    <label className="label" style={{ fontSize: 13, marginBottom: 4 }}>
                      Subtopic (Optional)
                    </label>
                    <select
                      className="input select"
                      value={selectedSubtopic}
                      onChange={e => setSelectedSubtopic(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="">All subtopics</option>
                      {subtopics.map(subtopic => (
                        <option key={subtopic.id} value={subtopic.id}>{subtopic.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedSubject && selectedChapterObj && (
                  <div className="note" style={{ padding: 12, background: 'var(--panel)', borderRadius: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>📖 Current Context:</div>
                    <div style={{ fontSize: 12 }}>
                      {selectedSubject} → {selectedChapterObj.title}
                      {selectedSubtopicObj && ` → ${selectedSubtopicObj.title}`}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="card" style={{ padding: 20, borderRadius: 8, marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>💬 Chat</h3>
                {messages.length > 0 && (
                  <button className="btn-ghost" onClick={handleClearChat} style={{ fontSize: 12 }}>
                    🗑️ Clear Chat
                  </button>
                )}
              </div>

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
                    <p className="note">Select a subject and chapter, then start asking questions!</p>
                    <p className="note" style={{ marginTop: 8, fontSize: 12 }}>
                      I can help you with materials uploaded by your teachers.
                    </p>
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

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder={
                    !selectedSubject || !selectedChapter
                      ? 'Select a subject and chapter first...'
                      : 'Ask a question about this topic...'
                  }
                  disabled={loading || !selectedSubject || !selectedChapter}
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
                  disabled={loading || !input.trim() || !selectedSubject || !selectedChapter}
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

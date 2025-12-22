"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { useRouter, usePathname } from 'next/navigation'
import {
  listStudentAssignments,
  rosterBy,
  getClasses,
  getSectionsForClass,
  saveAssignment,
  readAssignmentFor,
  type AssignmentEntry,
  type AssignmentStatus
} from '../data'

// File Download Button Component
function FileDownloadButton({ file }: { file: any }) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(false)

  const handleDownload = async () => {
    setLoading(true)
    setError(false)
    
    try {
      const isB2Key = file.dataUrl && !file.dataUrl.startsWith('data:')
      
      if (isB2Key) {
        const { getSignedUrl } = await import('@/lib/uploadToBackblaze')
        const signedUrl = await getSignedUrl(file.dataUrl)
        
        if (signedUrl) {
          window.open(signedUrl, '_blank')
        } else {
          setError(true)
        }
      } else {
        const link = document.createElement('a')
        link.href = file.dataUrl
        link.download = file.name
        link.click()
      }
    } catch (err) {
      console.error('Download error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className="btn-ghost"
      type="button"
      onClick={handleDownload}
      disabled={loading}
      style={{ fontSize: 12, padding: '4px 8px' }}
    >
      {loading ? '⏳' : error ? '❌' : '📥'}
    </button>
  )
}

const navLinks: Array<{ href: Route; label: string; icon: string }> = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/teacher/attendance', label: 'Attendance', icon: '✅' },
  { href: '/teacher/analytics', label: 'Analytics', icon: '📈' },
  { href: '/teacher/assignments', label: 'Assignments', icon: '📚' },
  { href: '/teacher/diary', label: 'Digital Diary', icon: '📔' },
  { href: '/teacher/calendar', label: 'Academic Calendar', icon: '📅' },
  { href: '/teacher/marks', label: 'Marks Entry', icon: '✏️' },
  { href: '/teacher/academic-content', label: 'Academic Content', icon: '📘' },
  { href: '/teacher/circulars', label: 'Circulars', icon: '📣' },
]

export default function TeacherAssignmentsPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [teacherName, setTeacherName] = React.useState<string>('Teacher')
  const [cards, setCards] = React.useState<AssignmentEntry[]>([])
  const [selected, setSelected] = React.useState<AssignmentEntry | null>(null)
  const [klass, setKlass] = React.useState<string>('')
  const [section, setSection] = React.useState<'A' | 'B' | ''>('')
  const [rows, setRows] = React.useState<Array<{ usn: string; name: string; status: AssignmentStatus }>>([])
  const [message, setMessage] = React.useState<string>('')
  const [ready, setReady] = React.useState(false)
  const [deletingAttachment, setDeletingAttachment] = React.useState(false)
  const detailRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('teacher')
      if (raw) {
        const sess = JSON.parse(raw)
        if (sess?.name) {
          setTeacherName(String(sess.name))
          setCards(listStudentAssignments(sess.name || ''))
          return
        }
      }
      // Fallback: show all assignments if teacher is unknown
      setCards(listStudentAssignments())
    } catch {
      setCards(listStudentAssignments())
    }
  }, [])

  React.useEffect(() => {
    setReady(true)
  }, [])

  // When a card is selected, initialise class/section from that assignment
  React.useEffect(() => {
    if (!selected) return
    setKlass(selected.klass)
    setSection(selected.section as any)
  }, [selected])

  // Ensure section stays valid if class changes
  React.useEffect(() => {
    if (!klass) return
    setSection(prev => {
      const arr = getSectionsForClass(klass)
      if (arr && arr.length) {
        return (prev && arr.includes(prev)) ? prev : (arr[0] as any)
      }
      return '' as any
    })
  }, [klass])

  const students = React.useMemo(
    () => (klass && section ? rosterBy(klass, section) : []),
    [klass, section]
  )

  // Hide the detail card when tapping/clicking outside it
  React.useEffect(() => {
    if (!selected) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      // Keep detail open if tap is inside detail card or on an assignment card
      if (detailRef.current?.contains(target)) return
      if ((target as HTMLElement | null)?.closest?.('[data-assignment-card="true"]')) return
      setSelected(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [selected])

  // Load existing assignment rows for the selected assignment & class/section
  React.useEffect(() => {
    if (!selected || !klass || !section) {
      setRows([])
      return
    }
    const existing = readAssignmentFor(selected.date, klass, section, selected.subject)
    if (existing) {
      const map = new Map(existing.items.map(i => [String(i.usn), i]))
      const merged = students.map(s => {
        const row = map.get(String(s.usn))
        return {
          usn: s.usn,
          name: s.name,
          status: (row?.status || 'pending') as AssignmentStatus
        }
      })
      setRows(merged)
    } else {
      const initial = students.map(s => ({
        usn: s.usn,
        name: s.name,
        status: 'pending' as AssignmentStatus
      }))
      setRows(initial)
    }
  }, [selected, klass, section, students])

  const updateStatus = (usn: string, status: AssignmentStatus) => {
    setRows(prev => prev.map(r => (r.usn === usn ? { ...r, status } : r)))
  }

  const onSave = () => {
    if (!selected || !klass || !section) {
      setMessage('Select a class and section.')
      setTimeout(() => setMessage(''), 1500)
      return
    }
    saveAssignment({
      date: selected.date,
      deadline: selected.deadline || selected.date,
      note: selected.note,
      attachments: selected.attachments,
      subject: selected.subject,
      klass,
      section,
      items: rows,
      createdBy: teacherName || 'Teacher'
    })
    setMessage('Assignment status saved for this class.')
    setTimeout(() => setMessage(''), 1500)
  }

  const deleteAttachment = async (attachmentIndex: number) => {
    if (!selected) return
    
    const attachment = selected.attachments?.[attachmentIndex]
    if (!attachment) return
    
    if (!confirm(`Delete ${attachment.name || 'this attachment'}?`)) return
    
    setDeletingAttachment(true)
    setMessage('Deleting file...')
    
    try {
      // If it's a B2 file, delete from storage
      if (attachment.type === 'file' && attachment.dataUrl && !attachment.dataUrl.startsWith('data:')) {
        const response = await fetch('/api/storage/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ b2Key: attachment.dataUrl })
        })
        
        if (!response.ok) {
          console.error('Failed to delete from B2')
        }
      }
      
      // Update selected assignment
      const updatedAttachments = selected.attachments?.filter((_, i) => i !== attachmentIndex) || []
      const updatedSelected = { ...selected, attachments: updatedAttachments }
      setSelected(updatedSelected)
      
      // Save updated assignment to all class/section combinations
      saveAssignment({
        date: selected.date,
        deadline: selected.deadline || selected.date,
        note: selected.note,
        attachments: updatedAttachments,
        subject: selected.subject,
        klass,
        section,
        items: rows,
        createdBy: teacherName || 'Teacher'
      })
      
      // Refresh cards list
      setCards(listStudentAssignments(teacherName))
      
      setMessage('Attachment deleted successfully.')
      setTimeout(() => setMessage(''), 2000)
    } catch (error) {
      console.error('Delete error:', error)
      setMessage('Failed to delete attachment.')
      setTimeout(() => setMessage(''), 2000)
    } finally {
      setDeletingAttachment(false)
    }
  }

  return (
    <div className="teacher-shell">
      <div className="topbar topbar-teacher">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>Teacher</strong>
          </div>
        </div>
      </div>

      <div className="dash-wrap teacher-main">
        <div className="dash-layout">
          <aside className="side-nav side-nav-teacher" aria-label="Teacher quick navigation">
            {navLinks.map(link => {
              const active = pathname?.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`side-nav-link ${active ? 'side-nav-link-active' : ''}`}
                  aria-label={link.label}
                >
                  <span className="side-nav-icon">{link.icon}</span>
                  <span>{link.label.split(' ')[0]}</span>
                </Link>
              )
            })}
          </aside>

          <div className="dash">
        <div className="greeting">Assignments you have published.</div>

            <section className="card">
          {cards.length === 0 && (
            <p className="note">
              No assignments yet. Publish from “Digital Diary / Assignment” on the teacher dashboard to see them here.
            </p>
          )}
          <div style={{ display: 'grid', gap: 10 }}>
            {cards.map((a, idx) => (
              <button
                key={`${a.date}-${a.klass}-${a.section}-${a.subject}-${idx}`}
                type="button"
                className="note-card"
                data-assignment-card="true"
                style={{ textAlign: 'left', cursor: 'pointer' }}
                onClick={() => setSelected(a)}
              >
                <div style={{ fontWeight: 700 }}>{a.subject}</div>
                <div className="note">
                  {a.klass} {a.section} • {a.date} {a.deadline && a.deadline !== a.date ? `→ ${a.deadline}` : ''}
                </div>
              </button>
            ))}
          </div>
        </section>

        {ready && selected && (
          <section ref={detailRef} className="card" style={{ marginTop: 16 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <select
                  className="input select"
                  value={klass}
                  onChange={e => setKlass(e.target.value)}
                >
                  {getClasses().map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  className="input select"
                  value={section}
                  onChange={e => setSection(e.target.value as any)}
                >
                  {klass &&
                    getSectionsForClass(klass).map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                </select>
                <div className="note" style={{ fontSize: 12 }}>
                  {selected.subject} • {selected.date}
                  {selected.deadline && selected.deadline !== selected.date
                    ? ` → ${selected.deadline}`
                    : ''}
                </div>
              </div>

              {/* Assignment Note */}
              {selected.note && (
                <div className="paper-view" style={{ padding: 12, background: 'var(--panel)', borderRadius: 8 }}>
                  {selected.note}
                </div>
              )}

              {/* Attachments Section */}
              {Array.isArray(selected.attachments) && selected.attachments.length > 0 && (
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>📎 Attachments</div>
                  {selected.attachments.map((a: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px dashed var(--panel-border)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        background: 'var(--panel)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <span className="note">{a.type === 'link' ? '🔗' : '📄'}</span>
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.type === 'link' ? a.url : a.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {a.type === 'link' ? (
                          <a
                            className="btn-ghost"
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 12, padding: '4px 8px' }}
                          >
                            Open
                          </a>
                        ) : (
                          <FileDownloadButton file={a} />
                        )}
                        <button
                          className="btn-ghost"
                          type="button"
                          onClick={() => deleteAttachment(i)}
                          disabled={deletingAttachment}
                          style={{ 
                            fontSize: 12, 
                            padding: '4px 8px',
                            color: '#dc2626'
                          }}
                        >
                          {deletingAttachment ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="table" style={{ overflow: 'hidden' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Student</th>
                      <th style={{ textAlign: 'center' }}>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.usn}>
                        <td>
                          <strong>{r.usn}</strong> — {r.name}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={r.status === 'submitted'}
                            onChange={e =>
                              updateStatus(r.usn, e.target.checked ? 'submitted' : 'pending')
                            }
                          />
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={2} style={{ padding: 12 }}>
                          <span className="note">
                            No students for this class/section yet.
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="actions" style={{ justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <button
                    className="btn-ghost"
                    type="button"
                    onClick={() =>
                      setRows(prev => prev.map(r => ({ ...r, status: 'submitted' })))
                    }
                  >
                    Mark all submitted
                  </button>
                  <button
                    className="btn-ghost"
                    type="button"
                    onClick={() =>
                      setRows(prev => prev.map(r => ({ ...r, status: 'pending' })))
                    }
                    style={{ marginLeft: 8 }}
                  >
                    Clear all
                  </button>
                </div>
                <button className="btn" type="button" onClick={onSave}>
                  Save Assignment Status
                </button>
              </div>
              {message && <div className="profile-message">{message}</div>}
            </div>
          </section>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

export default function TeacherAssignmentsPage() {
  const router = useRouter()
  const [teacherName, setTeacherName] = React.useState<string>('Teacher')
  const [cards, setCards] = React.useState<AssignmentEntry[]>([])
  const [selected, setSelected] = React.useState<AssignmentEntry | null>(null)
  const [klass, setKlass] = React.useState<string>('')
  const [section, setSection] = React.useState<'A' | 'B' | ''>('')
  const [rows, setRows] = React.useState<Array<{ usn: string; name: string; status: AssignmentStatus }>>([])
  const [message, setMessage] = React.useState<string>('')
  const [ready, setReady] = React.useState(false)

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

  return (
    <div>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>Teacher</strong>
          </div>
          <nav className="tabs" aria-label="Teacher navigation">
            <Link className="tab" href="/teacher/dashboard">Dashboard</Link>
            <Link className="tab" href="/teacher/academic-content">Academic Content</Link>
            <Link className="tab" href="/teacher/circulars">Circulars</Link>
            <Link className="tab" href="/teacher/marks">Marks Entry</Link>
            <Link className="tab tab-active" href="/teacher/assignments">Assignments</Link>
          </nav>
          <div className="actions">
            <button className="btn-ghost" type="button" onClick={() => router.push('/')}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="dash-wrap">
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
          <section className="card" style={{ marginTop: 16 }}>
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
  )
}

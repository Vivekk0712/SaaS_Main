"use client"
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getClasses,
  getSectionsForClass,
  getAssignedClassesForTeacher,
  getAssignedSectionsForTeacher,
  getAssignedSubjectsForTeacher,
  getClassSubjects,
  getSubjects,
  rosterBy,
  saveDiary,
  saveAssignment
} from '../data'

export default function TeacherDiaryPage() {
  const router = useRouter()
  const [teacher, setTeacher] = React.useState<{ name: string; subject: string } | null>(null)
  const [teacherSubjects, setTeacherSubjects] = React.useState<string[]>([])

  const [diaryDate, setDiaryDate] = React.useState<string>(() => new Date().toISOString().slice(0, 10))
  const [diaryDueDate, setDiaryDueDate] = React.useState<string>(() => new Date().toISOString().slice(0, 10))
  const [diaryKlass, setDiaryKlass] = React.useState<string>(() => getClasses()[0] || '')
  const [diarySection, setDiarySection] = React.useState<string>(() => getSectionsForClass(getClasses()[0] || '')[0] || '')
  const [diarySubject, setDiarySubject] = React.useState<string>('')
  const [diaryNote, setDiaryNote] = React.useState('')
  const [linkInput, setLinkInput] = React.useState('')
  const [attachments, setAttachments] = React.useState<Array<any>>([])
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('teacher')
      if (!raw) return
      const t = JSON.parse(raw)
      setTeacher(t)
      const classes = getAssignedClassesForTeacher(t.name)
      if (classes.length) {
        const k = classes[0]
        setDiaryKlass(k)
        const secs = getAssignedSectionsForTeacher(t.name, k)
        setDiarySection(secs[0] || getSectionsForClass(k)[0] || '')
      }
      // Load subjects for this teacher from staff records
      try {
        const tRaw = localStorage.getItem('school:teachers')
        const list = tRaw ? JSON.parse(tRaw) : []
        const rec = Array.isArray(list)
          ? list.find(
              (x: any) =>
                x.name && t.name && String(x.name).toLowerCase() === String(t.name).toLowerCase(),
            )
          : null
        const subs: string[] =
          rec?.subjects && Array.isArray(rec.subjects)
            ? rec.subjects
            : rec?.subject
            ? [rec.subject]
            : t.subject
            ? [t.subject]
            : []
        setTeacherSubjects(subs)
        setDiarySubject(subs[0] || t.subject || '')
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }
  }, [])

  React.useEffect(() => {
    setDiarySection(prev => {
      const arr = getSectionsForClass(diaryKlass)
      return arr.includes(prev) ? prev : (arr[0] || '')
    })
  }, [diaryKlass])

  React.useEffect(() => {
    if (!teacher) return
    const assigned = getAssignedSubjectsForTeacher(teacher.name, diaryKlass, diarySection)
    const classSubs = getClassSubjects(diaryKlass, diarySection)
    const base =
      assigned.length
        ? assigned
        : classSubs.length
        ? classSubs
        : teacherSubjects.length
        ? teacherSubjects
        : getSubjects()
    setDiarySubject(prev => (base.includes(prev) ? prev : (base[0] || prev)))
  }, [teacher, teacherSubjects, diaryKlass, diarySection])

  const addLink = () => {
    try {
      const u = new URL(linkInput.trim())
      setAttachments(prev => [{ type: 'link', url: u.toString() }, ...prev])
      setLinkInput('')
    } catch {
      setMessage('Enter a valid URL starting with http or https')
      setTimeout(() => setMessage(''), 1200)
    }
  }

  const addFiles = async (files?: FileList | null) => {
    if (!files) return
    const items: any[] = []
    for (const f of Array.from(files)) {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onerror = () => rej('read-error')
        r.onload = () => res(String(r.result))
        r.readAsDataURL(f)
      })
      items.push({
        type: 'file',
        name: f.name,
        mime: f.type || 'application/octet-stream',
        dataUrl,
      })
    }
    if (items.length) setAttachments(prev => [...items, ...prev])
  }

  const onSaveDiary = () => {
    if (!teacher) return
    const note = diaryNote.trim()
    if (!note && attachments.length === 0) {
      setMessage('Enter a note or add an attachment.')
      setTimeout(() => setMessage(''), 1500)
      return
    }
    const subj = (diarySubject || teacher.subject || '').trim()
    const entry = {
      subject: subj,
      teacher: teacher.name,
      note,
      klass: diaryKlass,
      section: diarySection as any,
      attachments,
    }
    saveDiary(diaryDate, entry)
    try {
      const list = rosterBy(diaryKlass, diarySection as any)
      const items = list.map(s => ({ usn: s.usn, name: s.name, status: 'pending' as const }))
      saveAssignment({
        date: diaryDate,
        deadline: diaryDueDate || diaryDate,
        note,
        attachments,
        subject: subj,
        klass: diaryKlass,
        section: diarySection as any,
        items,
        createdBy: teacher.name,
      })
    } catch {
      // ignore
    }
    setMessage('Diary updated for the selected date.')
    setDiaryNote('')
    setDiaryDueDate(diaryDate)
    setAttachments([])
    setLinkInput('')
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
            <Link className="tab" href="/teacher/dashboard">
              Dashboard
            </Link>
            <Link className="tab" href="/teacher/academic-content">
              Academic Content
            </Link>
            <Link className="tab" href="/teacher/circulars">
              Circulars
            </Link>
            <Link className="tab" href="/teacher/marks">
              Marks Entry
            </Link>
            <span className="tab tab-active">Digital Diary / Assignment</span>
          </nav>
        </div>
      </div>

      <div className="dash-wrap">
        <div className="dash">
          <h2 className="title">Digital Diary / Assignment</h2>
          <p className="subtitle">
            Publish homework or diary updates for a class and section; students will see these on
            their dashboards.
          </p>

          <section className="cal" aria-label="Digital diary form">
            <div className="cal-head">
              <div className="cal-title">Create / Update Entry</div>
            </div>
            <div style={{ padding: 18, display: 'grid', gap: 10 }}>
              <div style={{ display: 'grid', gap: 8 }}>
                <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                  <input
                    className="input"
                    type="date"
                    value={diaryDate}
                    onChange={e => {
                      setDiaryDate(e.target.value)
                      if (!diaryDueDate) setDiaryDueDate(e.target.value)
                    }}
                  />
                  <input
                    className="input"
                    type="date"
                    value={diaryDueDate}
                    onChange={e => setDiaryDueDate(e.target.value)}
                  />
                </div>
                <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                  <select
                    className="input select"
                    value={diarySubject}
                    onChange={e => setDiarySubject(e.target.value)}
                  >
                    {(function () {
                      if (!teacher) return []
                      const assigned = getAssignedSubjectsForTeacher(
                        teacher.name,
                        diaryKlass,
                        diarySection,
                      )
                      const classSubs = getClassSubjects(diaryKlass, diarySection)
                      const base =
                        assigned.length
                          ? assigned
                          : classSubs.length
                          ? classSubs
                          : teacherSubjects.length
                          ? teacherSubjects
                          : getSubjects()
                      return base.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))
                    })()}
                  </select>
                  <select
                    className="input select"
                    value={diaryKlass}
                    onChange={e => setDiaryKlass(e.target.value)}
                  >
                    {(teacher
                      ? getAssignedClassesForTeacher(teacher.name).length
                        ? getAssignedClassesForTeacher(teacher.name)
                        : getClasses()
                      : getClasses()
                    ).map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    className="input select"
                    value={diarySection}
                    onChange={e => setDiarySection(e.target.value)}
                  >
                    {(teacher
                      ? getAssignedSectionsForTeacher(teacher.name, diaryKlass).length
                        ? getAssignedSectionsForTeacher(teacher.name, diaryKlass)
                        : getSectionsForClass(diaryKlass)
                      : getSectionsForClass(diaryKlass)
                    ).map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                className="paper"
                style={{ minHeight: 160 }}
                placeholder="Enter assignment/diary update"
                value={diaryNote}
                onChange={e => setDiaryNote(e.target.value)}
              />

              <div className="row">
                <input
                  className="input"
                  placeholder="https://link.to/resource"
                  value={linkInput}
                  onChange={e => setLinkInput(e.target.value)}
                />
                <button type="button" className="btn-ghost" onClick={addLink}>
                  Add Link
                </button>
              </div>

              <div className="row" style={{ alignItems: 'center' }}>
                <input
                  className="input"
                  type="file"
                  multiple
                  onChange={e => addFiles(e.target.files)}
                />
              </div>

              {attachments.length > 0 && (
                <div style={{ display: 'grid', gap: 6 }}>
                  {attachments.map((a, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px dashed var(--panel-border)',
                        borderRadius: 8,
                        padding: '6px 10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="note">{a.type === 'link' ? 'Link' : 'File'}</span>
                        <span style={{ fontWeight: 600 }}>
                          {a.type === 'link' ? a.url : a.name}
                        </span>
                      </div>
                      <button
                        className="btn-ghost"
                        type="button"
                        onClick={() =>
                          setAttachments(prev => prev.filter((_, idx) => idx !== i))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="actions" style={{ marginTop: 4 }}>
                <button className="btn" type="button" onClick={onSaveDiary}>
                  Publish for selected date
                </button>
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={() => {
                    const qp = new URLSearchParams()
                    qp.set('date', diaryDate)
                    qp.set('klass', diaryKlass)
                    qp.set('section', diarySection)
                    qp.set('subject', diarySubject || teacher?.subject || '')
                    router.push(`/teacher/assignments?${qp.toString()}`)
                  }}
                >
                  Open assignment status
                </button>
              </div>

              {message && <div className="profile-message">{message}</div>}
            </div>
          </section>
        </div>

        <div className="dash" style={{ marginTop: 24 }}>
          <Link className="back" href="/teacher/dashboard">
            &larr; Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

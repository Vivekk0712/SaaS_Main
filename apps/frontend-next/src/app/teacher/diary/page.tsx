"use client"

import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { useRouter, usePathname } from 'next/navigation'
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
  saveAssignment,
} from '../data'

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

// File Download Button Component - handles B2 signed URLs
function FileDownloadButton({ file }: { file: any }) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(false)

  const handleDownload = async () => {
    setLoading(true)
    setError(false)
    
    try {
      // Check if dataUrl is a B2 key or base64
      const isB2Key = file.dataUrl && !file.dataUrl.startsWith('data:')
      
      if (isB2Key) {
        // Get signed URL from B2
        const { getSignedUrl } = await import('@/lib/uploadToBackblaze')
        const signedUrl = await getSignedUrl(file.dataUrl)
        
        if (signedUrl) {
          // Open in new tab or trigger download
          window.open(signedUrl, '_blank')
        } else {
          setError(true)
        }
      } else {
        // Legacy base64 - direct download
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
    >
      {loading ? 'Loading...' : error ? 'Error' : 'Download'}
    </button>
  )
}

export default function TeacherDiaryPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [teacher, setTeacher] = React.useState<{ name: string; subject: string } | null>(null)
  const [teacherSubjects, setTeacherSubjects] = React.useState<string[]>([])

  const [diaryDate, setDiaryDate] = React.useState<string>(() => new Date().toISOString().slice(0, 10))
  const [diaryDueDate, setDiaryDueDate] = React.useState<string>(() => new Date().toISOString().slice(0, 10))
  const [diaryKlass, setDiaryKlass] = React.useState<string>(() => getClasses()[0] || '')
  const [diarySection, setDiarySection] = React.useState<string>(
    () => getSectionsForClass(getClasses()[0] || '')[0] || '',
  )
  const [diarySubject, setDiarySubject] = React.useState<string>('')
  const [diaryNote, setDiaryNote] = React.useState('')
  const [linkInput, setLinkInput] = React.useState('')
  const [attachments, setAttachments] = React.useState<Array<any>>([])
  const [message, setMessage] = React.useState('')
  const [uploading, setUploading] = React.useState(false)

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
      return arr.includes(prev) ? prev : arr[0] || ''
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
    setDiarySubject(prev => (base.includes(prev) ? prev : base[0] || prev))
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
    
    setUploading(true)
    setMessage('Uploading files to cloud storage...')
    const { uploadFileToB2 } = await import('@/lib/uploadToBackblaze')
    
    const items: any[] = []
    let successCount = 0
    let failCount = 0
    
    for (const f of Array.from(files)) {
      // Upload to Backblaze B2
      const result = await uploadFileToB2(f, {
        klass: diaryKlass,
        section: diarySection,
        subject: diarySubject || teacher?.subject || 'General',
        type: 'material',
        chapterId: `diary-${diaryDate}`, // Use diary date as chapter ID
      }, (progress) => {
        setMessage(`Uploading ${f.name}... ${progress.percentage}%`)
      })
      
      if (result.success) {
        // Store B2 reference instead of base64
        items.push({
          type: 'file',
          name: f.name,
          mime: f.type || 'application/octet-stream',
          dataUrl: result.b2Key, // Store B2 key instead of base64
          b2Key: result.b2Key,
          fileSize: result.fileSize,
        })
        successCount++
      } else {
        failCount++
        console.error(`Failed to upload ${f.name}:`, result.error)
      }
    }
    
    if (items.length) {
      setAttachments(prev => [...prev, ...items])
      setMessage(`${successCount} file(s) uploaded${failCount > 0 ? `, ${failCount} failed` : ''}.`)
      setTimeout(() => setMessage(''), 2000)
    } else if (failCount > 0) {
      setMessage(`Failed to upload ${failCount} file(s).`)
      setTimeout(() => setMessage(''), 2000)
    }
    
    setUploading(false)
  }

  const onSaveDiary = () => {
    if (!teacher) return
    const note = diaryNote.trim()
    if (!note && attachments.length === 0) {
      setMessage('Enter a note or add an attachment.')
      setTimeout(() => setMessage(''), 1500)
      return
    }
    
    console.log('Saving diary with attachments:', attachments) // Debug log
    
    const subj = (diarySubject || teacher.subject || '').trim()
    const entry = {
      subject: subj,
      teacher: teacher.name,
      note,
      klass: diaryKlass,
      section: diarySection as any,
      attachments,
    }
    
    console.log('Diary entry:', entry) // Debug log
    
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span className="note">{a.type === 'link' ? 'Link' : 'File'}</span>
                          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.type === 'link' ? a.url : a.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {a.type === 'file' && (
                            <FileDownloadButton file={a} />
                          )}
                          {a.type === 'link' && (
                            <a
                              className="btn-ghost"
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open
                            </a>
                          )}
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
                      </div>
                    ))}
                  </div>
                )}

                <div className="actions" style={{ marginTop: 4 }}>
                  <button 
                    className="btn" 
                    type="button" 
                    onClick={onSaveDiary}
                    disabled={uploading}
                  >
                    {uploading ? '⏳ Uploading files...' : 'Publish for selected date'}
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

            <div className="dash" style={{ marginTop: 24 }}>
              <Link className="back" href="/teacher/dashboard">
                &larr; Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


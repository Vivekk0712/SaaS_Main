"use client"

import React from "react"
import Link from "next/link"
import type { Route } from "next"
import { usePathname, useRouter } from "next/navigation"
import {
  getClasses,
  getSectionsForClass,
  getAssignedClassesForTeacher,
  getAssignedSectionsForTeacher,
  getAssignedSubjectsForTeacher,
  getClassSubjects,
  readSyllabus,
  saveSyllabus,
  type SyllabusChapter,
} from "../data"

const navLinks: Array<{ href: Route; label: string; icon: string }> = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/teacher/attendance", label: "Attendance", icon: "✅" },
  { href: "/teacher/analytics", label: "Analytics", icon: "📈" },
  { href: "/teacher/assignments", label: "Assignments", icon: "📚" },
  { href: "/teacher/diary", label: "Digital Diary", icon: "📔" },
  { href: "/teacher/calendar", label: "Academic Calendar", icon: "📅" },
  { href: "/teacher/marks", label: "Marks Entry", icon: "✏️" },
  { href: "/teacher/academic-content", label: "Academic Content", icon: "📘" },
  { href: "/teacher/circulars", label: "Circulars", icon: "📣" },
]

function parseChaptersFromIndex(text: string): SyllabusChapter[] {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.replace(/\s+/g, " ").trim())
    .filter(l => l.length > 0)

  const chapters: SyllabusChapter[] = []
  const seen = new Set<string>()

  const chapterPatterns = [
    /^(chapter|unit)\s+\d+[\s:.\-]+(.+)/i,
    /^(\d{1,2}\s*[\.\-–]\s+)(.+)/,
    /^(\d{1,2}\s+[A-Za-z].+)/,
  ]

  for (const raw of lines) {
    const line = raw.replace(/\.+\s*\d+\s*$/, "").trim()
    if (!line) continue
    let title: string | null = null

    for (const pat of chapterPatterns) {
      const m = line.match(pat)
      if (m) {
        if (m[2]) {
          title = `${line}`.trim()
        } else {
          title = line.trim()
        }
        break
      }
    }

    if (!title) continue
    const key = title.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    chapters.push({ id: `${chapters.length + 1}`, title, subtopics: [] })
  }

  if (chapters.length === 0) {
    const fallback = lines.filter(l => /^[A-Z0-9].{8,}$/.test(l)).slice(0, 10)
    return fallback.map((l, idx) => ({
      id: `${idx + 1}`,
      title: l,
      subtopics: [],
    }))
  }

  return chapters
}

export default function TeacherAcademicContent() {
  const pathname = usePathname()
  const router = useRouter()
  const [teacher, setTeacher] = React.useState<{ name: string; subject: string } | null>(null)
  const [klass, setKlass] = React.useState<string>("")
  const [section, setSection] = React.useState<string>("")
  const [subject, setSubject] = React.useState<string>("")
  const [mounted, setMounted] = React.useState(false)

  const [chapters, setChapters] = React.useState<SyllabusChapter[]>([])
  const [message, setMessage] = React.useState("")
  // Simple chapter planner state
  const [chapterCountInput, setChapterCountInput] = React.useState<string>("")

  React.useEffect(() => {
    setMounted(true)
    try {
      const raw = sessionStorage.getItem("teacher")
      if (raw) {
        const t = JSON.parse(raw)
        setTeacher(t)
        const classes = getAssignedClassesForTeacher(t.name)
        if (classes.length) {
          const first = classes[0]
          setKlass(first)
          const secs = getAssignedSectionsForTeacher(t.name, first)
          const sec = secs[0] || getSectionsForClass(first)[0] || ""
          setSection(sec)
          const subs = getAssignedSubjectsForTeacher(t.name, first, sec)
          const classSubs = getClassSubjects(first, sec)
          const list = subs.length ? subs : classSubs.length ? classSubs : []
          setSubject(list[0] || t.subject || "")
        } else {
          const all = getClasses()
          const first = all[0] || ""
          setKlass(first)
          const sec = getSectionsForClass(first)[0] || ""
          setSection(sec)
          const classSubs = getClassSubjects(first, sec)
          setSubject(classSubs[0] || t.subject || "")
        }
      }
    } catch {
      // ignore
    }
  }, [])

  React.useEffect(() => {
    setSection(prev => {
      const arr = getSectionsForClass(klass)
      return arr.includes(prev) ? prev : arr[0] || ""
    })
  }, [klass])

  const loadAll = React.useCallback(() => {
    if (!klass || !section || !subject) return
    try {
      const syl = readSyllabus(klass, section, subject)
      setChapters(syl.chapters || [])
    } catch {
      setChapters([])
    }
  }, [klass, section, subject])

  React.useEffect(() => {
    loadAll()
  }, [loadAll])

  const subjectOptions = React.useMemo(() => {
    if (!teacher) return [] as string[]
    const subs = getAssignedSubjectsForTeacher(teacher.name, klass, section)
    const classSubs = getClassSubjects(klass, section)
    return subs.length ? subs : classSubs
  }, [teacher, klass, section])

  const saveCurrentSyllabus = (nextChapters: SyllabusChapter[]) => {
    if (!klass || !section || !subject) return
    try {
      saveSyllabus({ klass, section, subject, chapters: nextChapters })
    } catch {
      // ignore
    }
  }

  const applyChapterCount = () => {
    const raw = chapterCountInput.trim()
    if (!raw) {
      setMessage("Enter total chapters (e.g., 10)")
      setTimeout(() => setMessage(""), 1400)
      return
    }
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0 || n > 25) {
      setMessage("Enter a valid number of chapters between 1 and 25.")
      setTimeout(() => setMessage(""), 1800)
      return
    }
    setChapters(prev => {
      const existing = prev || []
      const next: SyllabusChapter[] = []
      for (let i = 0; i < n; i++) {
        if (existing[i]) {
          next.push(existing[i])
        } else {
          next.push({
            id: `${Date.now()}-${i}`,
            title: `Chapter ${i + 1}`,
            subtopics: [],
          })
        }
      }
      saveCurrentSyllabus(next)
      return next
    })
    setMessage("Chapters grid updated.")
    setTimeout(() => setMessage(""), 1400)
  }

  const updateChapterTitle = (id: string, title: string) => {
    setChapters(prev => {
      const next = (prev || []).map(ch =>
        ch.id === id ? { ...ch, title } : ch,
      )
      saveCurrentSyllabus(next)
      return next
    })
  }

  const addSubtopic = (chapterId: string) => {
    setChapters(prev => {
      const next = (prev || []).map(ch =>
        ch.id === chapterId
          ? {
              ...ch,
              subtopics: [
                ...ch.subtopics,
                {
                  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                  title: `Topic ${ch.subtopics.length + 1}`,
                  details: "",
                  links: [],
                },
              ],
            }
          : ch,
      )
      saveCurrentSyllabus(next)
      return next
    })
  }

  const updateSubtopic = (
    chapterId: string,
    subId: string,
    field: "title" | "details" | "links",
    value: string,
  ) => {
    setChapters(prev => {
      const next = (prev || []).map(ch => {
        if (ch.id !== chapterId) return ch
        const updatedSubs = ch.subtopics.map(st => {
          if (st.id !== subId) return st
          if (field === "title") {
            return { ...st, title: value }
          }
          if (field === "details") {
            return { ...st, details: value }
          }
          if (field === "links") {
            const raw = value || ""
            const links = raw
              .split(",")
              .map(s => s.trim())
              .filter(Boolean)
            return { ...st, links }
          }
          return st
        })
        return { ...ch, subtopics: updatedSubs }
      })
      saveCurrentSyllabus(next)
      return next
    })
  }

  const generateSyllabusFromContentsPdf = async () => {
    if (!klass || !section || !subject) {
      setMessage("Select class, section, and subject first.")
      setTimeout(() => setMessage(""), 1500)
      return
    }
    if (!pendingSylFile) {
      setMessage("Select a contents/index PDF first.")
      setTimeout(() => setMessage(""), 1500)
      return
    }
    try {
      setMessage("Reading contents PDF to build syllabus...")
      const arrayBuffer = await pendingSylFile.arrayBuffer()
      const pdfjs: any = await import("pdfjs-dist/build/pdf")
      if (pdfjs.GlobalWorkerOptions && pdfjs.version) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
      }
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      const maxPages = Math.min(pdf.numPages || 1, 8)
      let allText = ""
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const strings = (content.items || []).map((it: any) => it.str || "").filter(Boolean)
        allText += strings.join(" ") + "\n"
      }
      const nextChapters = parseChaptersFromIndex(allText)
      if (!nextChapters.length) {
        setMessage("Could not detect chapters from contents PDF.")
        setTimeout(() => setMessage(""), 2500)
        return
      }
      setChapters(nextChapters)
      saveSyllabus({ klass, section, subject, chapters: nextChapters })
      setMessage("Syllabus auto-generated from contents PDF.")
      setTimeout(() => setMessage(""), 2500)
      setPendingSylFile(null)
      setPendingSylName("")
    } catch {
      setMessage("Failed to auto-generate syllabus from contents PDF.")
      setTimeout(() => setMessage(""), 2500)
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
                  className={`side-nav-link ${active ? "side-nav-link-active" : ""}`}
                  aria-label={link.label}
                >
                  <span className="side-nav-icon">{link.icon}</span>
                  <span>{link.label.split(" ")[0]}</span>
                </Link>
              )
            })}
          </aside>

          <div className="dash">
            <h2 className="title">Academic Syllabus</h2>
            <p className="subtitle">
              Upload a separate contents/index PDF to auto-generate syllabus; manage textbooks and notes/materials per
              subject.
            </p>

            <div className="chart-card" style={{ display: "grid", gap: 10 }}>
              <div className="row">
                <select className="input select" value={klass} onChange={e => setKlass(e.target.value)}>
                  <option value="">Select Class</option>
                  {mounted
                    ? (teacher
                        ? getAssignedClassesForTeacher(teacher.name).length
                          ? getAssignedClassesForTeacher(teacher.name)
                          : getClasses()
                        : getClasses()
                      ).map(c => (
                        <option key={c}>{c}</option>
                      ))
                    : null}
                </select>
                <select className="input select" value={section} onChange={e => setSection(e.target.value)}>
                  <option value="">Section</option>
                  {mounted
                    ? (teacher
                        ? getAssignedSectionsForTeacher(teacher.name, klass).length
                          ? getAssignedSectionsForTeacher(teacher.name, klass)
                          : getSectionsForClass(klass)
                        : getSectionsForClass(klass)
                      ).map(s => (
                        <option key={s}>{s}</option>
                      ))
                    : null}
                </select>
                <select className="input select" value={subject} onChange={e => setSubject(e.target.value)}>
                  <option value="">Subject</option>
                  {mounted ? subjectOptions.map(s => <option key={s}>{s}</option>) : null}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 12 }}>
              <div className="chart-card">
                <div className="chart-title">Syllabus — Chapters &amp; Subtopics</div>
                <div className="note" style={{ marginBottom: 8 }}>
                  Enter how many chapters you handle for this class/section/subject. We&apos;ll create that many colorful
                  boxes. Inside each chapter you can add subtopics, short notes, and helpful links.
                </div>
                <div className="row" style={{ marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={25}
                    placeholder="Total chapters (e.g., 10)"
                    value={chapterCountInput}
                    onChange={e => setChapterCountInput(e.target.value)}
                    style={{ maxWidth: 220 }}
                  />
                  <button className="btn" type="button" onClick={applyChapterCount}>
                    Create / Resize Chapters Grid
                  </button>
                </div>
                <div
                  className="parent"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gridAutoRows: "minmax(120px, auto)",
                    gap: 12,
                    marginTop: 10,
                  }}
                >
                  {chapters.map((ch, idx) => {
                    const palette = [
                      "linear-gradient(135deg, #0b1220, #1d4ed8)",
                      "linear-gradient(135deg, #022c22, #16a34a)",
                      "linear-gradient(135deg, #111827, #7c3aed)",
                      "linear-gradient(135deg, #3f1f0e, #ea580c)",
                      "linear-gradient(135deg, #111827, #14b8a6)",
                      "linear-gradient(135deg, #31102b, #e11d48)",
                    ]
                    const bg = palette[idx % palette.length]
                    const openChapter = () => {
                      const qp = new URLSearchParams()
                      qp.set("chapterId", ch.id)
                      if (klass) qp.set("klass", klass)
                      if (section) qp.set("section", section)
                      if (subject) qp.set("subject", subject)
                      router.push(`/teacher/academic-content/chapter?${qp.toString()}`)
                    }
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={openChapter}
                        style={{
                          borderRadius: 14,
                          padding: 12,
                          background: bg,
                          color: "#f9fafb",
                          boxShadow: "0 18px 40px rgba(15,23,42,0.75)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          textAlign: "left",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 11, opacity: 0.9 }}>Chapter {idx + 1}</div>
                          <div
                            style={{
                              fontWeight: 800,
                              marginTop: 4,
                              fontSize: 13,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ch.title || `Chapter ${idx + 1}`}
                          </div>
                        </div>
                        <div
                          style={{
                            marginTop: 10,
                            fontSize: 11,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            opacity: 0.9,
                          }}
                        >
                          <span>
                            {(ch.subtopics || []).length
                              ? `${ch.subtopics.length} subtopic${ch.subtopics.length === 1 ? "" : "s"}`
                              : "No subtopics yet"}
                          </span>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 999,
                              background: "rgba(15,23,42,0.75)",
                              border: "1px solid rgba(148,163,184,0.7)",
                            }}
                          >
                            Open
                          </span>
                        </div>
                      </button>
                    )
                  })}
                  {chapters.length === 0 && (
                    <div className="note">
                      No chapters yet. Enter the total chapters above and click &quot;Create / Resize Chapters Grid&quot;.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {message && (
              <div className="profile-message" style={{ marginTop: 8 }}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

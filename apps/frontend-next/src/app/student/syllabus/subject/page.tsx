"use client"

import React from "react"
import Link from "next/link"
import type { Route } from "next"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { findStudent, readSyllabus } from "../../../teacher/data"

const navLinks: Array<{ href: Route; label: string; icon: string }> = [
  { href: "/student/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/student/progress", label: "Progress", icon: "📊" },
  { href: "/student/attendance", label: "Attendance", icon: "✅" },
  { href: "/student/diary", label: "Digital Diary", icon: "📔" },
  { href: "/student/calendar", label: "Calendar", icon: "📅" },
  { href: "/student/circulars", label: "Circulars", icon: "📣" },
  { href: "/student/syllabus", label: "Academic Syllabus", icon: "📘" },
]

export default function StudentSubjectSyllabusPage() {
  const pathname = usePathname()
  const search = useSearchParams()
  const router = useRouter()

  const subject = search.get("subject") || ""
  const [me, setMe] = React.useState<{ klass: string; section: string; usn: string } | null>(null)

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("student")
      if (!raw) return
      const { roll } = JSON.parse(raw)
      const s = findStudent(roll)
      if (s) {
        setMe({ klass: s.klass, section: s.section as any, usn: s.usn })
      }
    } catch {
      // ignore
    }
  }, [])

  const syllabus = React.useMemo(() => {
    if (!me || !subject) return { chapters: [] as any[] }
    try {
      return readSyllabus(me.klass, me.section, subject)
    } catch {
      return { chapters: [] as any[] }
    }
  }, [me, subject])

  const chapters = (syllabus.chapters || []) as any[]

  return (
    <div className="student-shell">
      <div className="topbar topbar-student">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>STUDENT</strong>
          </div>
          <nav className="tabs" aria-label="Student quick navigation tabs">
            {[0, 1, 2].map(i => (
              <button
                key={i}
                type="button"
                className="tab"
                style={{ pointerEvents: "none", opacity: 0.4 }}
                aria-hidden="true"
              >
                &nbsp;
              </button>
            ))}
          </nav>
          <div />
        </div>
      </div>
      <div className="dash-wrap student-main">
        <div className="dash-layout">
          <aside className="side-nav side-nav-student" aria-label="Student quick navigation">
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
            <div
              style={{
                height: 6,
                width: 64,
                borderRadius: 999,
                background: "#3b2c1a",
                marginBottom: 10,
              }}
            />
            <h2 className="title">Chapters – {subject || "Subject"}</h2>
            <p className="subtitle">
              Tap a chapter card to open its topics and attached PDFs/notes.
            </p>

            <div
              className="parent"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gridAutoRows: "minmax(120px, auto)",
                gap: 12,
                marginTop: 16,
              }}
            >
              {chapters.map((ch, idx) => {
                const palette = [
                  "linear-gradient(135deg, #0b1220, #1d4ed8)",
                  "linear-gradient(135deg, #022c22, #059669)",
                  "linear-gradient(135deg, #111827, #7c3aed)",
                  "linear-gradient(135deg, #3f1f0e, #ea580c)",
                  "linear-gradient(135deg, #111827, #14b8a6)",
                  "linear-gradient(135deg, #31102b, #e11d48)",
                ]
                const bg = palette[idx % palette.length]
                const href =
                  `/student/syllabus/chapter?subject=${encodeURIComponent(
                    subject,
                  )}&chapterId=${encodeURIComponent(ch.id)}` as Route
                return (
                  <Link
                    key={ch.id}
                    href={href}
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      background: bg,
                      boxShadow: "0 16px 32px rgba(15,23,42,0.7)",
                      border: "1px solid rgba(148,163,184,0.7)",
                      color: "#f9fafb",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      textDecoration: "none",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.85 }}>Chapter {idx + 1}</div>
                      <div
                        style={{
                          fontFamily:
                            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                          fontWeight: 800,
                          marginTop: 4,
                          fontSize: 14,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ch.title}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        marginTop: 8,
                        opacity: 0.9,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        {(ch.subtopics || []).length
                          ? `${ch.subtopics.length} topic${
                              ch.subtopics.length === 1 ? "" : "s"
                            }`
                          : "No topics yet"}
                      </span>
                      <span
                        className="chip-pill"
                        style={{
                          background: "rgba(15,23,42,0.8)",
                          borderColor: "rgba(148,163,184,0.9)",
                          color: "#e5e7eb",
                        }}
                      >
                        Open
                      </span>
                    </div>
                  </Link>
                )
              })}
              {chapters.length === 0 && (
                <div className="note">Syllabus not published yet for this subject.</div>
              )}
            </div>

            <div className="dash" style={{ marginTop: 24 }}>
              <button
                type="button"
                className="back"
                onClick={() => router.push("/student/syllabus")}
              >
                &larr; Back to subjects
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


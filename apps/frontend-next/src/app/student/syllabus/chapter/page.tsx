"use client"

import React from "react"
import Link from "next/link"
import type { Route } from "next"
import { usePathname, useSearchParams } from "next/navigation"
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

export default function StudentChapterSyllabusPage() {
  const pathname = usePathname()
  const search = useSearchParams()

  const subject = search.get("subject") || ""
  const chapterId = search.get("chapterId") || ""

  const [me, setMe] = React.useState<{ klass: string; section: string; usn: string } | null>(null)
  const [viewer, setViewer] = React.useState<{ url: string; name: string } | null>(null)

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

  const chapter = React.useMemo(() => {
    if (!me || !subject || !chapterId) return null
    try {
      const syl = readSyllabus(me.klass, me.section, subject)
      return (syl.chapters || []).find((c: any) => c.id === chapterId) || null
    } catch {
      return null
    }
  }, [me, subject, chapterId])

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
            {navLinks
              .filter(link =>
                link.href === '/student/dashboard' ||
                link.href === '/student/diary' ||
                link.href === '/student/calendar' ||
                link.href === '/student/syllabus'
              )
              .map(link => {
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
            <h2 className="title">
              {subject ? `${subject} — Chapter` : "Chapter Syllabus"}
            </h2>
            <p className="subtitle">
              Tap a topic card to open PDF or notes shared by teachers.
            </p>

            {!chapter && (
              <div className="chart-card" style={{ marginTop: 8 }}>
                <div className="note">Chapter not found for this subject.</div>
              </div>
            )}

            {chapter && (
              <div className="chart-card" style={{ marginTop: 8 }}>
                <div className="chart-title">{chapter.title || "Chapter"}</div>
                <div
                  className="parent"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gridAutoRows: "minmax(120px, auto)",
                    gap: 10,
                    marginTop: 8,
                  }}
                >
                  {(chapter.subtopics || []).map((t: any, i: number) => {
                    const legacyLinks = Array.isArray(t.links) ? t.links : []
                    const rawAttachments = Array.isArray(t.attachments) ? t.attachments : []
                    const attachmentLinks = rawAttachments
                      .filter((a: any) => a && a.type === "link" && typeof a.url === "string")
                      .map((a: any) => a.url as string)
                    const fileAttachments = rawAttachments.filter(
                      (a: any) => a && a.type === "file",
                    )
                    const links = [...legacyLinks, ...attachmentLinks]
                    const code = (t.code as string | undefined) || ""
                    return (
                      <div
                        key={t.id || `${chapter.id}-${i}`}
                        style={{
                          borderRadius: 12,
                          padding: 10,
                          border: "1px solid var(--panel-border)",
                          background: "var(--panel)",
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div style={{ fontWeight: 800 }}>
                          {code ? `${code} ` : `${i + 1}. `}
                          {t.title || "Topic"}
                        </div>
                        {t.details && <div className="note">{t.details}</div>}
                        {links.length > 0 && (
                          <div style={{ marginTop: 2, display: "grid", gap: 4 }}>
                            {links.map((lnk: string, j: number) => (
                              <a
                                key={j}
                                className="back"
                                href={lnk}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: 11,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {lnk}
                              </a>
                            ))}
                          </div>
                        )}
                        {fileAttachments.length > 0 && (
                          <div style={{ marginTop: 4, display: "grid", gap: 6 }}>
                            {fileAttachments.map((a: any, j: number) => {
                              const name = a.name as string
                              const url = a.dataUrl as string
                              return (
                                <div
                                  key={j}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    border: "1px dashed var(--panel-border)",
                                    borderRadius: 8,
                                    padding: "4px 8px",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 600,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      marginRight: 8,
                                    }}
                                    title={name}
                                  >
                                    {name}
                                  </div>
                                  <div className="row" style={{ gap: 6, margin: 0 }}>
                                    <button
                                      className="btn-ghost"
                                      type="button"
                                      onClick={() => setViewer({ url, name })}
                                    >
                                      View
                                    </button>
                                    <a className="btn-ghost" href={url} download={name}>
                                      Download
                                    </a>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {(chapter.subtopics || []).length === 0 && (
                    <div className="note">No topics yet for this chapter.</div>
                  )}
                </div>
              </div>
            )}

            {viewer && (
              <div
                role="dialog"
                aria-label="Document viewer"
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.6)",
                  zIndex: 1000,
                  display: "grid",
                  placeItems: "center",
                }}
                onClick={() => setViewer(null)}
              >
                <div
                  style={{
                    width: "min(960px, 96vw)",
                    height: "80vh",
                    background: "var(--panel)",
                    border: "1px solid var(--panel-border)",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderBottom: "1px solid var(--panel-border)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {viewer.name}
                    </div>
                    <div className="row" style={{ gap: 8, margin: 0 }}>
                      <a
                        className="btn-ghost"
                        href={viewer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open
                      </a>
                      <a className="btn-ghost" href={viewer.url} download>
                        Download
                      </a>
                      <button className="btn-ghost" onClick={() => setViewer(null)}>
                        Close
                      </button>
                    </div>
                  </div>
                  <div style={{ height: "calc(100% - 44px)", background: "#fff" }}>
                    <object data={viewer.url} type="application/pdf" width="100%" height="100%">
                      <iframe
                        src={viewer.url}
                        title="Document"
                        style={{ width: "100%", height: "100%", border: 0 }}
                      />
                    </object>
                  </div>
                </div>
              </div>
            )}

            <div className="dash" style={{ marginTop: 24 }}>
              <Link
                className="back"
                href={`/student/syllabus/subject?subject=${encodeURIComponent(subject)}` as Route}
              >
                &larr; Back to chapters
              </Link>
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="student-logout-fab"
        onClick={() => {
          try {
            sessionStorage.removeItem('student')
          } catch {}
          try {
            window.location.href = '/'
          } catch {}
        }}
        aria-label="Logout"
      >
        ⏻
      </button>
    </div>
  )
}

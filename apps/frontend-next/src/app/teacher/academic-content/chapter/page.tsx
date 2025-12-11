"use client"

import React from "react"
import Link from "next/link"
import type { Route } from "next"
import { usePathname, useSearchParams } from "next/navigation"
import {
  readSyllabus,
  saveSyllabus,
  addSubtopicMaterial,
  type SyllabusChapter,
  type SyllabusSubtopic,
  type AttachmentLink,
  type AttachmentFile,
} from "../../data"

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

type SubtopicRowProps = {
  index: number
  subtopic: SyllabusSubtopic
  attachments: Array<AttachmentLink | AttachmentFile>
  onUpdateField: (field: "code" | "title" | "details", value: string) => void
  onAddLink: (url: string) => void
  onAddFiles: (files?: FileList | null) => void
  onRemoveSubtopic: () => void
  onRemoveAttachment: (index: number) => void
}

function SubtopicRow({
  index,
  subtopic,
  attachments,
  onUpdateField,
  onAddLink,
  onAddFiles,
  onRemoveSubtopic,
  onRemoveAttachment,
}: SubtopicRowProps) {
  const [linkInput, setLinkInput] = React.useState("")
  const [pendingFiles, setPendingFiles] = React.useState<FileList | null>(null)

  return (
    <div
      style={{
        border: "1px solid var(--panel-border)",
        borderRadius: 10,
        padding: "8px 10px",
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span className="note">Subtopic {index + 1}</span>
          <input
            className="input"
            style={{ maxWidth: 90 }}
            placeholder="1.1"
            value={subtopic.code || ""}
            onChange={e => onUpdateField("code", e.target.value)}
          />
          <input
            className="input"
            placeholder="Subtopic title"
            value={subtopic.title}
            onChange={e => onUpdateField("title", e.target.value)}
          />
        </div>
        <button className="btn-ghost" type="button" onClick={onRemoveSubtopic}>
          Delete
        </button>
      </div>

      <textarea
        className="paper"
        placeholder="Notes for this subtopic"
        value={subtopic.details || ""}
        onChange={e => onUpdateField("details", e.target.value)}
        style={{ minHeight: 70 }}
      />

      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        <input
          className="input"
          placeholder="Paste link (https://...) (optional)"
          value={linkInput}
          onChange={e => setLinkInput(e.target.value)}
          style={{ flex: 1, minWidth: 180 }}
        />
        <input
          className="input"
          type="file"
          multiple
          onChange={e => setPendingFiles(e.target.files)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <button
          className="btn"
          type="button"
          style={{
            background: "#f97316",
            borderColor: "#ea580c",
            color: "#111827",
            fontWeight: 700,
            paddingInline: 14,
          }}
          onClick={() => {
            const link = (linkInput || "").trim()
            if (!link && (!pendingFiles || pendingFiles.length === 0)) return
            if (link) {
              onAddLink(link)
            }
            if (pendingFiles && pendingFiles.length > 0) {
              onAddFiles(pendingFiles)
            }
            setLinkInput("")
            setPendingFiles(null)
          }}
        >
          Upload
        </button>
      </div>

      {attachments.length > 0 && (
        <div style={{ display: "grid", gap: 6 }}>
          {attachments.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px dashed var(--panel-border)",
                borderRadius: 8,
                padding: "6px 8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 0,
                }}
              >
                <span className="note">{a.type === "link" ? "Link" : "File"}</span>
                <span
                  style={{
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.type === "link"
                    ? (a as AttachmentLink).url
                    : (a as AttachmentFile).name}
                </span>
              </div>
              <div className="row" style={{ gap: 6, margin: 0 }}>
                {a.type === "link" ? (
                  <a
                    className="btn-ghost"
                    href={(a as AttachmentLink).url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open
                  </a>
                ) : (
                  <a
                    className="btn-ghost"
                    href={(a as AttachmentFile).dataUrl}
                    download={(a as AttachmentFile).name}
                  >
                    Download
                  </a>
                )}
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={() => onRemoveAttachment(i)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TeacherChapterDetailPage() {
  const pathname = usePathname()
  const search = useSearchParams()

  const klass = search.get("klass") || ""
  const section = search.get("section") || ""
  const subject = search.get("subject") || ""
  const chapterId = search.get("chapterId") || ""

  const [chapters, setChapters] = React.useState<SyllabusChapter[]>([])
  const [message, setMessage] = React.useState("")

  React.useEffect(() => {
    if (!klass || !section || !subject) return
    try {
      const syl = readSyllabus(klass, section, subject)
      setChapters(syl.chapters || [])
    } catch {
      setChapters([])
    }
  }, [klass, section, subject])

  const saveChapters = (next: SyllabusChapter[], msg?: string) => {
    try {
      saveSyllabus({ klass, section, subject, chapters: next })
      setChapters(next)
      if (msg) {
        setMessage(msg)
        setTimeout(() => setMessage(""), 1600)
      }
    } catch {
      setMessage("Failed to save changes.")
      setTimeout(() => setMessage(""), 1600)
    }
  }

  const chapter = React.useMemo(
    () => chapters.find(c => c.id === chapterId) || null,
    [chapters, chapterId],
  )

  const updateSubtopicField = (
    subId: string,
    field: "code" | "title" | "details",
    value: string,
  ) => {
    const next = chapters.map(ch => {
      if (ch.id !== chapterId) return ch
      const subs = ch.subtopics.map(st =>
        st.id === subId ? { ...st, [field]: value } : st,
      )
      return { ...ch, subtopics: subs }
    })
    saveChapters(next)
  }

  const addSubtopic = () => {
    const next = chapters.map(ch => {
      if (ch.id !== chapterId) return ch
      const subs = ch.subtopics || []
      const n: SyllabusSubtopic = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: "",
        code: "",
        details: "",
        links: [],
        attachments: [],
      }
      return { ...ch, subtopics: [...subs, n] }
    })
    saveChapters(next, "Subtopic added.")
  }

  const removeSubtopic = (subId: string) => {
    const next = chapters.map(ch => {
      if (ch.id !== chapterId) return ch
      const subs = (ch.subtopics || []).filter(st => st.id !== subId)
      return { ...ch, subtopics: subs }
    })
    saveChapters(next, "Subtopic removed.")
  }

  const updateAttachments = (
    subId: string,
    fn: (prev: Array<AttachmentLink | AttachmentFile>) => Array<AttachmentLink | AttachmentFile>,
  ) => {
    const next = chapters.map(ch => {
      if (ch.id !== chapterId) return ch
      const subs = ch.subtopics.map(st => {
        if (st.id !== subId) return st
        const prev = Array.isArray(st.attachments) ? st.attachments : []
        const attachments = fn(prev)
        return { ...st, attachments }
      })
      return { ...ch, subtopics: subs }
    })
    saveChapters(next)
  }

  const addLink = (subId: string, rawUrl: string) => {
    const trimmed = rawUrl.trim()
    if (!trimmed) return
    try {
      const u = new URL(trimmed)
      const item: AttachmentLink = { type: "link", url: u.toString() }
      updateAttachments(subId, prev => [item, ...prev])
      addSubtopicMaterial(klass, section, subject, chapterId, subId, item)
      setMessage("Link added.")
      setTimeout(() => setMessage(""), 1200)
    } catch {
      setMessage("Enter a valid URL starting with http or https.")
      setTimeout(() => setMessage(""), 1500)
    }
  }

  const addFiles = async (subId: string, files?: FileList | null) => {
    if (!files || files.length === 0) return
    const items: AttachmentFile[] = []
    for (const f of Array.from(files)) {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onerror = () => rej("")
        r.onload = () => res(String(r.result))
        r.readAsDataURL(f)
      })
      items.push({
        type: "file",
        name: f.name,
        mime: f.type || "application/octet-stream",
        dataUrl,
      })
    }
    if (items.length) {
      updateAttachments(subId, prev => [...items, ...prev])
      items.forEach(it => addSubtopicMaterial(klass, section, subject, chapterId, subId, it))
      setMessage("File(s) uploaded.")
      setTimeout(() => setMessage(""), 1200)
    }
  }

  const removeAttachment = (subId: string, index: number) => {
    updateAttachments(subId, prev => prev.filter((_, i) => i !== index))
    setMessage("Attachment removed.")
    setTimeout(() => setMessage(""), 1000)
  }

  if (!klass || !section || !subject || !chapterId) {
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
            <div className="dash">
              <h2 className="title">Academic Content</h2>
              <p className="subtitle">Missing chapter context. Please go back and try again.</p>
              <Link className="back" href="/teacher/academic-content">
                &larr; Back to Academic Content
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
            <h2 className="title">Chapter Content</h2>
            <p className="subtitle">
              Add subtopics for this chapter, attach notes, files, and links. Changes are saved for{" "}
              {klass} {section} — {subject}.
            </p>

            {!chapter && (
              <div className="chart-card" style={{ marginTop: 8 }}>
                <div className="note">Chapter not found. It may have been removed.</div>
                <Link className="back" href="/teacher/academic-content">
                  &larr; Back to Academic Content
                </Link>
              </div>
            )}

            {chapter && (
              <div className="chart-card" style={{ marginTop: 8 }}>
                <div
                  className="chart-title"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span>{chapter.title || "Untitled Chapter"}</span>
                  <button className="btn-ghost" type="button" onClick={addSubtopic}>
                    + Add subtopic
                  </button>
                </div>
                {chapter.subtopics.length === 0 && (
                  <div className="note" style={{ marginTop: 6 }}>
                    No subtopics yet. Click &quot;Add subtopic&quot; to start.
                  </div>
                )}
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  {chapter.subtopics.map((st, idx) => {
                    const attachments = Array.isArray(st.attachments) ? st.attachments : []
                    return (
                      <SubtopicRow
                        key={st.id}
                        index={idx}
                        subtopic={st}
                        attachments={attachments}
                        onUpdateField={(field, value) => updateSubtopicField(st.id, field, value)}
                        onAddLink={url => addLink(st.id, url)}
                        onAddFiles={files => addFiles(st.id, files)}
                        onRemoveSubtopic={() => removeSubtopic(st.id)}
                        onRemoveAttachment={i => removeAttachment(st.id, i)}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {message && (
              <div className="profile-message" style={{ marginTop: 8 }}>
                {message}
              </div>
            )}

            <div className="dash" style={{ marginTop: 18 }}>
              <Link className="back" href="/teacher/academic-content">
                &larr; Back to Academic Content
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"
import React from 'react'
import { getClasses, getSectionsForClass, getAssignedClassesForTeacher, getAssignedSectionsForTeacher, getAssignedSubjectsForTeacher, getClassSubjects, readSyllabus, saveSyllabus, setTextbook, addMaterial, listMaterials, listTextbooks, removeTextbook, removeMaterial, type SyllabusChapter, type AttachmentFile, type AttachmentLink, type TextbookEntry } from '../data'

function parseChaptersFromIndex(text: string): SyllabusChapter[] {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(l => l.length > 0)

  const chapters: SyllabusChapter[] = []
  const seen = new Set<string>()

  const chapterPatterns = [
    /^(chapter|unit)\s+\d+[\s:.\-]+(.+)/i,
    /^(\d{1,2}\s*[\.\-–]\s+)(.+)/,
    /^(\d{1,2}\s+[A-Za-z].+)/,
  ]

  for (const raw of lines) {
    const line = raw.replace(/\.+\s*\d+\s*$/, '').trim()
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
  const [teacher, setTeacher] = React.useState<{ name: string; subject: string } | null>(null)
  const [klass, setKlass] = React.useState<string>('')
  const [section, setSection] = React.useState<string>('')
  const [subject, setSubject] = React.useState<string>('')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    try { const raw = sessionStorage.getItem('teacher'); if (raw) {
      const t = JSON.parse(raw); setTeacher(t)
      const classes = getAssignedClassesForTeacher(t.name)
      if (classes.length) {
        setKlass(classes[0])
        const secs = getAssignedSectionsForTeacher(t.name, classes[0]); const sec = secs[0] || getSectionsForClass(classes[0])[0] || ''
        setSection(sec)
        const subs = getAssignedSubjectsForTeacher(t.name, classes[0], sec); const classSubs = getClassSubjects(classes[0], sec)
        const list = (subs.length ? subs : (classSubs.length ? classSubs : []))
        setSubject(list[0] || t.subject || '')
      } else {
        const all = getClasses(); setKlass(all[0] || '')
        const sec = getSectionsForClass(all[0] || '')[0] || ''; setSection(sec)
        const classSubs = getClassSubjects(all[0] || '', sec)
        setSubject((classSubs[0] || t.subject || ''))
      }
    } } catch {}
  }, [])

  React.useEffect(() => {
    setSection(prev => { const arr = getSectionsForClass(klass); return arr.includes(prev) ? prev : (arr[0] || '') })
  }, [klass])

  const [chapters, setChapters] = React.useState<SyllabusChapter[]>([])
  const [message, setMessage] = React.useState('')
  const [materials, setMaterials] = React.useState<Array<AttachmentLink | AttachmentFile>>([])
  const [books, setBooks] = React.useState<TextbookEntry[]>([])
  const [linkInput, setLinkInput] = React.useState('')
  const [pendingSylFile, setPendingSylFile] = React.useState<File | null>(null)
  const [pendingSylName, setPendingSylName] = React.useState<string>('')
  const [pendingTB, setPendingTB] = React.useState<File | null>(null)
  const [pendingChapterTB, setPendingChapterTB] = React.useState<File | null>(null)
  const [pendingTBName, setPendingTBName] = React.useState<string>('')
  const [pendingCTBName, setPendingCTBName] = React.useState<string>('')
  const [selChapter, setSelChapter] = React.useState<string>('')
  const [pendingMatFiles, setPendingMatFiles] = React.useState<File[]>([])
  const [viewer, setViewer] = React.useState<{ url: string; name: string } | null>(null)

  const loadAll = React.useCallback(() => {
    if (!klass || !section || !subject) return
    try { const syl = readSyllabus(klass, section, subject); setChapters(syl.chapters || []) } catch { setChapters([]) }
    try { setMaterials(listMaterials(klass, section, subject)) } catch { setMaterials([]) }
    try { setBooks(listTextbooks(klass, section, subject)) } catch { setBooks([]) }
  }, [klass, section, subject])

  React.useEffect(() => { loadAll() }, [loadAll])

  const publishTextbook = async (chapterId: string | null) => {
    try {
      const f = chapterId ? pendingChapterTB : pendingTB
      if (!f) { setMessage('Choose a file first'); setTimeout(()=>setMessage(''), 1000); return }
      const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onerror = () => rej(''); r.onload = () => res(String(r.result)); r.readAsDataURL(f) })
      setTextbook({ klass, section, subject, name: f.name, mime: f.type || 'application/octet-stream', dataUrl, chapterId: chapterId || undefined } as any)
      loadAll(); setMessage('Textbook published.'); setTimeout(()=>setMessage(''), 1600)
      setPendingTB(null); setPendingChapterTB(null); setSelChapter('')
      setPendingTBName(''); setPendingCTBName('')
    } catch { setMessage('Failed to publish'); setTimeout(()=>setMessage(''), 1200) }
  }

  const addLink = (kind: 'materials') => {
    try {
      const raw = linkInput.trim(); const u = new URL(raw)
      const item: AttachmentLink = { type: 'link', url: u.toString() }
      addMaterial(klass, section, subject, item); setLinkInput('')
      loadAll(); setMessage('Link published.'); setTimeout(()=>setMessage(''), 1000)
    } catch { setMessage('Enter a valid URL starting with http'); setTimeout(()=>setMessage(''), 1200) }
  }

  const publishMaterials = async () => {
    try {
      for (const f of pendingMatFiles) {
        const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onerror = () => rej('read-error'); r.onload = () => res(String(r.result)); r.readAsDataURL(f) })
        addMaterial(klass, section, subject, { type: 'file', name: f.name, mime: f.type || 'application/octet-stream', dataUrl })
      }
      setPendingMatFiles([])
      loadAll(); setMessage('Materials published.'); setTimeout(()=>setMessage(''), 1000)
    } catch {
      setMessage('Failed to publish one or more files'); setTimeout(()=>setMessage(''), 1500)
    }
  }
  const generateSyllabusFromContentsPdf = async () => {
    if (!klass || !section || !subject) {
      setMessage('Select class, section, and subject first.'); setTimeout(()=>setMessage(''), 1500)
      return
    }
    if (!pendingSylFile) {
      setMessage('Select a contents/index PDF first.'); setTimeout(()=>setMessage(''), 1500)
      return
    }
    try {
      setMessage('Reading contents PDF to build syllabus...')
      const arrayBuffer = await pendingSylFile.arrayBuffer()
      const pdfjs: any = await import('pdfjs-dist/build/pdf')
      if (pdfjs.GlobalWorkerOptions && pdfjs.version) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
      }
      const getDocument = pdfjs.getDocument
      if (!getDocument) throw new Error('PDF engine not available')
      const loadingTask = getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      const maxPages = Math.min(pdf.numPages || 1, 8)
      let allText = ''
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const strings = (content.items || []).map((it: any) => it.str || '').filter(Boolean)
        allText += strings.join(' ') + '\n'
      }
      const nextChapters = parseChaptersFromIndex(allText)
      if (!nextChapters.length) {
        setMessage('Could not detect chapters from contents PDF.'); setTimeout(()=>setMessage(''), 2500)
        return
      }
      setChapters(nextChapters)
      saveSyllabus({ klass, section, subject, chapters: nextChapters })
      setMessage('Syllabus auto-generated from contents PDF.'); setTimeout(()=>setMessage(''), 2500)
      setPendingSylFile(null); setPendingSylName('')
    } catch {
      setMessage('Failed to auto-generate syllabus from contents PDF.'); setTimeout(()=>setMessage(''), 2500)
    }
  }
  const subjectOptions = React.useMemo(() => {
    if (!teacher) return [] as string[]
    const subs = getAssignedSubjectsForTeacher(teacher.name, klass, section)
    const classSubs = getClassSubjects(klass, section)
    return (subs.length ? subs : classSubs)
  }, [teacher, klass, section])

  return (
    <div className="dash">
      <h2 className="title">Academic Syllabus</h2>
      <p className="subtitle">Upload a separate contents/index PDF to auto-generate syllabus; manage textbooks and notes/materials per subject.</p>

      <div className="chart-card" style={{display:'grid', gap:10}}>
        <div className="row">
          <select className="input select" value={klass} onChange={e=>setKlass(e.target.value)}>
            <option value="">Select Class</option>
            {mounted ? ((teacher ? (getAssignedClassesForTeacher(teacher.name).length ? getAssignedClassesForTeacher(teacher.name) : getClasses()) : getClasses()).map(c=> <option key={c}>{c}</option>)) : null}
          </select>
          <select className="input select" value={section} onChange={e=>setSection(e.target.value)}>
            <option value="">Section</option>
            {mounted ? ((teacher ? (getAssignedSectionsForTeacher(teacher.name, klass).length ? getAssignedSectionsForTeacher(teacher.name, klass) : getSectionsForClass(klass)) : getSectionsForClass(klass)).map(s=> <option key={s}>{s}</option>)) : null}
          </select>
          <select className="input select" value={subject} onChange={e=>setSubject(e.target.value)}>
            <option value="">Subject</option>
            {mounted ? (subjectOptions.map(s=> <option key={s}>{s}</option>)) : null}
          </select>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12}}>
        <div className="chart-card">
          <div className="chart-title">Syllabus — Auto-generated from Contents PDF</div>
          <div className="note" style={{marginBottom:8}}>
            Upload the chapter contents / index as a separate PDF here. The system will read that PDF and automatically create the syllabus for all chapters. Manual add is disabled.
          </div>
          <div className="row" style={{marginBottom:8}}>
            <input
              className="input"
              type="file"
              accept="application/pdf,application/*,.pdf"
              onChange={e => {
                const f = e.target.files?.[0] || null
                setPendingSylFile(f)
                setPendingSylName(f ? f.name : '')
              }}
            />
            <button className="btn" type="button" onClick={generateSyllabusFromContentsPdf}>Generate Syllabus</button>
          </div>
          {pendingSylName && <div className="note" style={{marginBottom:8}}>Selected contents PDF: {pendingSylName}</div>}
          <div style={{display:'grid', gap:8}}>
            {chapters.map((ch, idx) => (
              <div key={ch.id} style={{border:'1px solid var(--panel-border)', borderRadius:10, padding:10}}>
                <div style={{fontWeight:800}}>{idx+1}. {ch.title}</div>
              </div>
            ))}
            {chapters.length === 0 && <div className="note">No syllabus detected yet. Upload a contents/index PDF and click Generate Syllabus.</div>}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Textbooks</div>
          <div className="row">
            <select className="input select" value="" onChange={()=>{}} disabled>
              <option value="">Full Book</option>
            </select>
            <input className="input" type="file" accept="application/pdf,application/*,.pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp" onChange={e=> { const f=e.target.files?.[0]||null; setPendingTB(f); setPendingTBName(f?f.name:'') }} />
            <button className="btn" type="button" onClick={()=> publishTextbook(null)}>Publish</button>
          </div>
          {pendingTBName && <div className="note" style={{marginTop:6}}>Selected: {pendingTBName}</div>}
          <div className="row" style={{marginTop:8}}>
            <select className="input select" value={selChapter} onChange={e=> setSelChapter(e.target.value)}>
              <option value="">Attach to Chapter…</option>
              {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <input className="input" type="file" accept="application/pdf,application/*,.pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp" onChange={e=> { const f=e.target.files?.[0]||null; setPendingChapterTB(f); setPendingCTBName(f?f.name:'') }} />
            <button className="btn" type="button" onClick={()=> publishTextbook(selChapter || null)} disabled={!selChapter}>Publish</button>
          </div>
          {pendingCTBName && <div className="note" style={{marginTop:6}}>Selected (Chapter): {pendingCTBName}</div>}
          <div className="note" style={{marginTop:8}}>Published textbooks appear in the list below. Use View/Download; no inline preview here.</div>
        </div>
      </div>

      <div className="chart-card" style={{marginTop:12}}>
        <div className="chart-title">Published Textbooks (Logs)</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:8}}>
          {books.map((b, i) => {
            const ch = (b as any).chapterId
            const chTitle = ch ? (chapters.find(c => c.id === ch)?.title || `Chapter ${i+1}`) : 'Full Book'
            return (
              <div key={`${b.name}-${i}`} style={{border:'1px solid var(--panel-border)', borderRadius:10, padding:'8px 10px', display:'grid', gap:8}}>
                <div style={{display:'grid', gap:4}}>
                  <div style={{fontWeight:700}}>{chTitle}</div>
                  <small className="note">{b.name}</small>
                </div>
                <div className="row" style={{gap:8}}>
                  <button className="btn-ghost" onClick={()=> setViewer({ url: b.dataUrl, name: b.name })}>View</button>
                  <a className="btn-ghost" href={b.dataUrl} download>Download</a>
                  <button className="btn-ghost" onClick={()=> { removeTextbook(klass, section, subject, (b as any).chapterId || null, b.uploadedAt); loadAll() }}>Remove</button>
                </div>
              </div>
            )
          })}
          {books.length === 0 && <div className="note">No textbooks published yet.</div>}
        </div>
      </div>

      {viewer && (
        <div role="dialog" aria-label="Document viewer" style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'grid', placeItems:'center'}} onClick={()=>setViewer(null)}>
          <div style={{width:'min(960px, 96vw)', height:'80vh', background:'var(--panel)', border:'1px solid var(--panel-border)', borderRadius:12, overflow:'hidden'}} onClick={e=> e.stopPropagation()}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderBottom:'1px solid var(--panel-border)'}}>
              <div style={{fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={viewer.name}>{viewer.name}</div>
              <div className="row" style={{gap:8, margin:0}}>
                <a className="btn-ghost" href={viewer.url} target="_blank" rel="noopener noreferrer">Open</a>
                <a className="btn-ghost" href={viewer.url} download>Download</a>
                <button className="btn-ghost" onClick={()=>setViewer(null)}>Close</button>
              </div>
            </div>
            <div style={{height:'calc(100% - 44px)', background:'#fff'}}>
              <object data={viewer.url} type="application/pdf" width="100%" height="100%">
                <iframe src={viewer.url} title="Document" style={{width:'100%', height:'100%', border:0}} />
              </object>
            </div>
          </div>
        </div>
      )}

      <div className="chart-card" style={{marginTop:12}}>
        <div className="chart-title">Notes & Materials</div>
        <div className="row"><input className="input" placeholder="https://link.to/material" value={linkInput} onChange={e=>setLinkInput(e.target.value)} /><button className="btn-ghost" onClick={()=>addLink('materials')}>Publish Link</button></div>
        <div className="row"><input className="input" type="file" multiple accept="application/pdf,application/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.zip,.rar,image/*,video/*,audio/*" onChange={e=> {
          const files = e.target.files
          if (!files || files.length === 0) return
          setPendingMatFiles(prev => [...prev, ...Array.from(files)])
          setMessage('Files staged. Click Publish.'); setTimeout(()=>setMessage(''), 1000)
        }} /><button className="btn" type="button" onClick={publishMaterials} disabled={pendingMatFiles.length===0}>Publish Files</button></div>
        {pendingMatFiles.length>0 && (
          <div className="note" style={{marginTop:6}}>Staged: {pendingMatFiles.map(f=>f.name).join(', ')}</div>
        )}
        <div className="chart-title" style={{marginTop:10}}>Published Materials (Logs)</div>
        <div style={{display:'grid', gap:6, marginTop:6}}>
          {materials.map((m, i) => {
            const isFile = m.type === 'file'
            const name = isFile ? (m as AttachmentFile).name : (m as AttachmentLink).url
            const url = isFile ? (m as AttachmentFile).dataUrl : (m as AttachmentLink).url
            return (
              <div key={i} style={{display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:8, alignItems:'center', border:'1px dashed var(--panel-border)', borderRadius:8, padding:'6px 10px'}}>
                <div style={{fontWeight:700, overflow:'hidden', textOverflow:'ellipsis'}} title={name}>{name}</div>
                {isFile ? (
                  <button className="btn-ghost" onClick={()=> setViewer({ url, name })}>View</button>
                ) : (
                  <a className="btn-ghost" href={url} target="_blank" rel="noopener noreferrer">Open</a>
                )}
                <a className="btn-ghost" href={url} download>Download</a>
                <button className="btn-ghost" onClick={()=>{ removeMaterial(klass, section, subject, i); loadAll() }}>Remove</button>
              </div>
            )
          })}
          {materials.length === 0 && <div className="note">No materials yet.</div>}
        </div>
      </div>

      {viewer && (
        <div role="dialog" aria-label="Document viewer" style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'grid', placeItems:'center'}} onClick={()=>setViewer(null)}>
          <div style={{width:'min(960px, 96vw)', height:'80vh', background:'var(--panel)', border:'1px solid var(--panel-border)', borderRadius:12, overflow:'hidden'}} onClick={e=> e.stopPropagation()}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderBottom:'1px solid var(--panel-border)'}}>
              <div style={{fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={viewer.name}>{viewer.name}</div>
              <div className="row" style={{gap:8, margin:0}}>
                <a className="btn-ghost" href={viewer.url} target="_blank" rel="noopener noreferrer">Open</a>
                <a className="btn-ghost" href={viewer.url} download>Download</a>
                <button className="btn-ghost" onClick={()=>setViewer(null)}>Close</button>
              </div>
            </div>
            <div style={{height:'calc(100% - 44px)', background:'#fff'}}>
              <object data={viewer.url} type="application/pdf" width="100%" height="100%">
                <iframe src={viewer.url} title="Document" style={{width:'100%', height:'100%', border:0}} />
              </object>
            </div>
          </div>
        </div>
      )}

      {message && <div className="profile-message" style={{marginTop:8}}>{message}</div>}
    </div>
  )
}

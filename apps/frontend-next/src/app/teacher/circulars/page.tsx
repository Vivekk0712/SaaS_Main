"use client"
import React from 'react'
import { getClasses, getSectionsForClass, addCircular, AttachmentLink, AttachmentFile, getAssignedClassesForTeacher, getAssignedSectionsForTeacher } from '../data'

export default function TeacherCirculars() {
  const [teacher, setTeacher] = React.useState<{ name: string; subject: string } | null>(null)
  const [klass, setKlass] = React.useState<string>(() => getClasses()[0] || '')
  const [section, setSection] = React.useState<string>(() => {
    const all = getClasses()
    const first = all[0] || ''
    const secs = getSectionsForClass(first)
    return secs[0] || ''
  })
  const [classOptions, setClassOptions] = React.useState<string[]>(() => getClasses())
  const [sectionOptions, setSectionOptions] = React.useState<string[]>(() =>
    getSectionsForClass(getClasses()[0] || ''),
  )
  React.useEffect(() => {
    const baseSections =
      teacher != null
        ? (() => {
            const assigned = getAssignedSectionsForTeacher(teacher.name, klass)
            return assigned.length ? assigned : getSectionsForClass(klass)
          })()
        : getSectionsForClass(klass)
    setSectionOptions(baseSections)
    setSection(prev => (baseSections.includes(prev) ? prev : baseSections[0] || ''))
  }, [klass, teacher])
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('teacher')
      if (!raw) return
      const t = JSON.parse(raw)
      setTeacher(t)
      const classes = getAssignedClassesForTeacher(t.name)
      const baseClasses = classes.length ? classes : getClasses()
      setClassOptions(baseClasses)
      const firstClass = baseClasses[0] || ''
      setKlass(firstClass)
      const secs = getAssignedSectionsForTeacher(t.name, firstClass)
      const baseSections = secs.length ? secs : getSectionsForClass(firstClass)
      setSectionOptions(baseSections)
      setSection(baseSections[0] || '')
    } catch {}
  }, [])
  const [date, setDate] = React.useState<string>(() => new Date().toISOString().slice(0,10))
  const [title, setTitle] = React.useState('')
  const [body, setBody] = React.useState('')
  const [linkInput, setLinkInput] = React.useState('')
  const [attachments, setAttachments] = React.useState<Array<AttachmentLink | AttachmentFile>>([])
  const [message, setMessage] = React.useState('')

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
    const items: AttachmentFile[] = []
    for (const f of Array.from(files)) {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader(); r.onerror = () => rej(''); r.onload = () => res(String(r.result)); r.readAsDataURL(f)
      })
      items.push({ type: 'file', name: f.name, mime: f.type || 'application/octet-stream', dataUrl })
    }
    if (items.length) setAttachments(prev => [...items, ...prev])
  }

  const onPublish = () => {
    const t = title.trim()
    const b = body.trim()
    if (!t) { setMessage('Enter title'); setTimeout(()=>setMessage(''), 1200); return }
    if (!b && attachments.length === 0) { setMessage('Enter body or add attachment'); setTimeout(()=>setMessage(''), 1200); return }
    addCircular({ title: t, body: b, date, klass, section: section as any, attachments, createdBy: teacher?.name })
    setMessage('Circular published successfully.')
    setTitle(''); setBody(''); setAttachments([]); setLinkInput('')
    setTimeout(()=>setMessage(''), 1500)
  }

  return (
    <div className="dash">
      <h2 className="title">Circulars</h2>
      <p className="subtitle">Publish circulars to a specific class and section.</p>

      <div style={{display:'grid', gap:12, marginTop:12}}>
        <div className="row">
          <select className="input select" value={klass} onChange={e=>setKlass(e.target.value)}>
            {classOptions.map(c=> <option key={c}>{c}</option>)}
          </select>
          <select className="input select" value={section} onChange={e=>setSection(e.target.value)}>
            {sectionOptions.map(s=> <option key={s}>{s}</option>)}
          </select>
          <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <script dangerouslySetInnerHTML={{__html:''}} />
        <input className="input" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <textarea className="paper" style={{minHeight:140}} placeholder="Circular content" value={body} onChange={e=>setBody(e.target.value)} />
        <div className="row">
          <input className="input" placeholder="https://link.to/resource (optional)" value={linkInput} onChange={e=>setLinkInput(e.target.value)} />
          <button type="button" className="btn-ghost" onClick={addLink}>Add Link</button>
        </div>
        <div className="row" style={{alignItems:'center'}}>
          <input className="input" type="file" multiple onChange={e=>addFiles(e.target.files)} />
        </div>
        {attachments.length > 0 && (
          <div style={{display:'grid', gap:6}}>
            {attachments.map((a, i) => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px dashed var(--panel-border)', borderRadius:8, padding:'6px 10px'}}>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <span className="note">{a.type === 'link' ? 'Link' : 'File'}</span>
                  <span style={{fontWeight:600}}>{a.type === 'link' ? (a as AttachmentLink).url : (a as AttachmentFile).name}</span>
                </div>
                <button className="btn-ghost" type="button" onClick={()=> setAttachments(prev => prev.filter((_,idx)=> idx!==i))}>Remove</button>
              </div>
            ))}
          </div>
        )}
        <div className="actions">
          <button className="btn" type="button" onClick={onPublish}>Publish Circular</button>
        </div>
        {message && <div className="profile-message">{message}</div>}
      </div>
    </div>
  )
}

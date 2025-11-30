"use client"
import React from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL || ''

type AppData = {
  admission: { number?: string; date?: string; grade: string; year: string; section?: string; category: string }
  student: { firstName: string; lastName: string; dob: string; gender: string; nationality?: string; religion?: string; caste?: string; languages?: string }
  address: { permanent: string; correspondence: string }
  guardians: { father: string; fatherOccupation?: string; fatherPhone?: string; fatherEmail?: string; mother: string; motherOccupation?: string; motherPhone?: string; motherEmail?: string; guardian?: string }
  previousSchool?: { name?: string; board?: string; lastGrade?: string; yearOfCompletion?: string; reason?: string }
  health?: { bloodGroup?: string; allergies?: string; conditions?: string; emergencyName?: string; emergencyPhone?: string; relation?: string }
  transport?: { mode?: string; route?: string }
  documents?: { tc?: boolean; reportCard?: boolean; aadhaar?: boolean; photos?: boolean; others?: string }
  declaration?: { agree: boolean }
  photoDataUrl?: string
}

export default function ApplicationPage() {
  const [data, setData] = React.useState<AppData>({
    admission: { grade: '', year: '', category: '' },
    student: { firstName: '', lastName: '', dob: '', gender: '', nationality: '', religion: '', caste: '', languages: '' },
    address: { permanent: '', correspondence: '' },
    guardians: { father: '', fatherOccupation: '', fatherPhone: '', fatherEmail: '', mother: '', motherOccupation: '', motherPhone: '', motherEmail: '', guardian: '' },
    previousSchool: { name: '', board: '', lastGrade: '', yearOfCompletion: '', reason: '' },
    health: { bloodGroup: '', allergies: '', conditions: '', emergencyName: '', emergencyPhone: '', relation: '' },
    transport: { mode: '', route: '' },
    documents: { tc: false, reportCard: false, aadhaar: false, photos: false, others: '' },
    declaration: { agree: false },
    photoDataUrl: '',
  })
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, boolean>>({})
  const phone = React.useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('onb:parent') || '{}').phone || '' } catch { return '' }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return alert('Not logged in')
    const firstMissing = validate()
    if (firstMissing) {
      const el = document.querySelector(`[name="${firstMissing}"]`) as HTMLElement | null
      if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
      return
    }
    try {
      setSubmitting(true)
      try {
        const r = await fetch(`${API}/v1/onboarding/applications`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-parent-phone': phone },
          body: JSON.stringify({ application: data })
        })
        if (!r.ok) throw new Error('submit_failed')
      } catch {
        // fallback to local
        const rl = await fetch('/api/local/applications', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-parent-phone': phone },
          body: JSON.stringify({ application: data })
        })
        if (!rl.ok) throw new Error('local_submit_failed')
      }
      alert('Submitted. Admissions department has been notified.')
    } catch (e) { alert('Submit failed (server/local).') } finally { setSubmitting(false) }
  }

  const set = <K extends keyof AppData>(k: K, v: AppData[K]) => setData(d => ({ ...d, [k]: v }))
  const onPhoto = (file?: File) => {
    if (!file) return
    const r = new FileReader()
    r.onload = () => set('photoDataUrl', String(r.result || ''))
    r.readAsDataURL(file)
  }

  const validate = (): string | null => {
    const req: string[] = [
      'admission.year', 'admission.grade',
      'student.firstName', 'student.dob', 'student.gender',
      'address.permanent',
      'guardians.father', 'guardians.mother',
      'health.emergencyName', 'health.emergencyPhone',
    ]
    const next: Record<string, boolean> = {}
    const get = (path: string): any => path.split('.').reduce((acc: any, k: string) => (acc ? acc[k as any] : undefined), data as any)
    let first: string | null = null
    for (const key of req) {
      const val = get(key)
      const bad = typeof val === 'string' ? !val.trim() : !val
      if (bad) { next[key] = true; if (!first) first = key }
    }
    if (!data.declaration?.agree) { next['declaration.agree'] = true; if (!first) first = 'declaration.agree' }
    setErrors(next)
    return first
  }

  return (
    <div className="container">
      <div className="hero-card" style={{ marginBottom: 16 }}>
        <h1 className="title">New Admission Application</h1>
        <p className="subtitle">Fill the form below. It is styled like an A4 document and will be sent to the Admissions department instantly.</p>
      </div>
      <div className="paper-wrap">
        <div className="paper relative">
          <header>
            <div className="brand">SCHOOL SAS</div>
            <div className="meta">Application Form • Academic Year {new Date().getFullYear()}-{String(new Date().getFullYear()+1).slice(-2)}</div>
          </header>
          <div className="photo-box">
            {data.photoDataUrl ? <img src={data.photoDataUrl} alt="Passport" /> : <span style={{ color: '#64748b', fontSize: 12 }}>Passport Photo</span>}
          </div>
          <div className="body">
            <form onSubmit={submit}>
              <div className="section">
                <h3>Admission Details</h3>
                <div className="grid">
                  <label className="field"><span className="label">Admission Number</span>
                    <input className="input" placeholder="Auto/Manual" value={data.admission.number||''} onChange={e=>set('admission', { ...data.admission, number: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Date of Admission</span>
                    <input type="date" className="input" value={data.admission.date||''} onChange={e=>set('admission', { ...data.admission, date: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Academic Year</span>
                    <input name="admission.year" className={`input${errors['admission.year']?' invalid':''}`} placeholder="2025-26" value={data.admission.year} onChange={e=>{ set('admission', { ...data.admission, year: e.target.value }); setErrors(s=>({ ...s, ['admission.year']: false })) }} />
                  </label>
                  <label className="field"><span className="label">Grade Applied For</span>
                    <select name="admission.grade" className={`select${errors['admission.grade']?' invalid':''}`} value={data.admission.grade} onChange={e=>{ set('admission', { ...data.admission, grade: e.target.value }); setErrors(s=>({ ...s, ['admission.grade']: false })) }}>
                      <option value="">Select</option>
                      {['Nursery','LKG','UKG',...Array.from({length:12},(_,i)=>String(i+1))].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </label>
                  <label className="field"><span className="label">Section (if allotted)</span>
                    <input className="input" value={data.admission.section||''} onChange={e=>set('admission', { ...data.admission, section: e.target.value })} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Student Details</h3>
                <div className="grid">
                  <label className="field"><span className="label">First Name</span>
                    <input name="student.firstName" className={`input${errors['student.firstName']?' invalid':''}`} value={data.student.firstName} onChange={e=>{ set('student', { ...data.student, firstName: e.target.value }); setErrors(s=>({ ...s, ['student.firstName']: false })) }} />
                  </label>
                  <label className="field"><span className="label">Last Name</span>
                    <input className="input" value={data.student.lastName} onChange={e=>set('student', { ...data.student, lastName: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Date of Birth</span>
                    <input name="student.dob" type="date" className={`input${errors['student.dob']?' invalid':''}`} value={data.student.dob} onChange={e=>{ set('student', { ...data.student, dob: e.target.value }); setErrors(s=>({ ...s, ['student.dob']: false })) }} />
                  </label>
                  <label className="field"><span className="label">Gender</span>
                    <select name="student.gender" className={`select${errors['student.gender']?' invalid':''}`} value={data.student.gender} onChange={e=>{ set('student', { ...data.student, gender: e.target.value }); setErrors(s=>({ ...s, ['student.gender']: false })) }}>
                      <option value="">Select</option>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label className="field"><span className="label">Nationality</span>
                    <input className="input" value={data.student.nationality||''} onChange={e=>set('student', { ...data.student, nationality: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Religion</span>
                    <input className="input" value={data.student.religion||''} onChange={e=>set('student', { ...data.student, religion: e.target.value })} />
                  </label>
                    <label className="field"><span className="label">Caste/Community</span>
                    <input className="input" value={data.student.caste||''} onChange={e=>set('student', { ...data.student, caste: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Languages Known</span>
                    <input className="input" placeholder="English, Hindi, Kannada" value={data.student.languages||''} onChange={e=>set('student', { ...data.student, languages: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Passport Photo</span>
                    <input className="input" type="file" accept="image/*" onChange={e=>onPhoto(e.target.files?.[0])} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Address</h3>
                <div className="grid">
                  <label className="field"><span className="label">Permanent Address</span>
                    <textarea name="address.permanent" className={`textarea${errors['address.permanent']?' invalid':''}`} value={data.address.permanent} onChange={e=>{ set('address', { ...data.address, permanent: e.target.value }); setErrors(s=>({ ...s, ['address.permanent']: false })) }} />
                  </label>
                  <label className="field"><span className="label">Correspondence Address</span>
                    <textarea className="textarea" value={data.address.correspondence} onChange={e=>set('address', { ...data.address, correspondence: e.target.value })} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Parents/Guardians</h3>
                <div className="grid">
                  <label className="field"><span className="label">Father/Guardian</span>
                    <input name="guardians.father" className={`input${errors['guardians.father']?' invalid':''}`} value={data.guardians.father} onChange={e=>{ set('guardians', { ...data.guardians, father: e.target.value }); setErrors(s=>({ ...s, ['guardians.father']: false })) }} />
                  </label>
                  <label className="field"><span className="label">Occupation</span>
                    <input className="input" value={data.guardians.fatherOccupation||''} onChange={e=>set('guardians', { ...data.guardians, fatherOccupation: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Contact Number</span>
                    <input className="input" value={data.guardians.fatherPhone||''} onChange={e=>set('guardians', { ...data.guardians, fatherPhone: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Email ID</span>
                    <input className="input" value={data.guardians.fatherEmail||''} onChange={e=>set('guardians', { ...data.guardians, fatherEmail: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Mother/Guardian</span>
                    <input name="guardians.mother" className={`input${errors['guardians.mother']?' invalid':''}`} value={data.guardians.mother} onChange={e=>{ set('guardians', { ...data.guardians, mother: e.target.value }); setErrors(s=>({ ...s, ['guardians.mother']: false })) }} />
                  </label>
                  <label className="field"><span className="label">Occupation</span>
                    <input className="input" value={data.guardians.motherOccupation||''} onChange={e=>set('guardians', { ...data.guardians, motherOccupation: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Contact Number</span>
                    <input className="input" value={data.guardians.motherPhone||''} onChange={e=>set('guardians', { ...data.guardians, motherPhone: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Email ID</span>
                    <input className="input" value={data.guardians.motherEmail||''} onChange={e=>set('guardians', { ...data.guardians, motherEmail: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Guardian (if applicable)</span>
                    <input className="input" value={data.guardians.guardian||''} onChange={e=>set('guardians', { ...data.guardians, guardian: e.target.value })} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Previous School Details</h3>
                <div className="grid">
                  <label className="field"><span className="label">School Name</span>
                    <input className="input" value={data.previousSchool?.name||''} onChange={e=>set('previousSchool', { ...data.previousSchool!, name: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Board</span>
                    <input className="input" value={data.previousSchool?.board||''} onChange={e=>set('previousSchool', { ...data.previousSchool!, board: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Last Grade Completed</span>
                    <input className="input" value={data.previousSchool?.lastGrade||''} onChange={e=>set('previousSchool', { ...data.previousSchool!, lastGrade: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Year of Completion</span>
                    <input className="input" value={data.previousSchool?.yearOfCompletion||''} onChange={e=>set('previousSchool', { ...data.previousSchool!, yearOfCompletion: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Reason for Transfer</span>
                    <input className="input" value={data.previousSchool?.reason||''} onChange={e=>set('previousSchool', { ...data.previousSchool!, reason: e.target.value })} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Health and Emergency Information</h3>
                <div className="grid">
                  <label className="field"><span className="label">Blood Group</span>
                    <input className="input" value={data.health?.bloodGroup||''} onChange={e=>set('health', { ...data.health!, bloodGroup: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Known Allergies</span>
                    <input className="input" value={data.health?.allergies||''} onChange={e=>set('health', { ...data.health!, allergies: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Existing Medical Conditions</span>
                    <input className="input" value={data.health?.conditions||''} onChange={e=>set('health', { ...data.health!, conditions: e.target.value })} />
                  </label>
                  <label className="field"><span className="label">Emergency Contact Name</span>
                    <input name="health.emergencyName" className={`input${errors['health.emergencyName']?' invalid':''}`} value={data.health?.emergencyName||''} onChange={e=>{ set('health', { ...data.health!, emergencyName: e.target.value }); setErrors(s=>({ ...s, ['health.emergencyName']: false })) }} />
                  </label>
                  <label className="field"><span className="label">Emergency Contact Number</span>
                    <input name="health.emergencyPhone" className={`input${errors['health.emergencyPhone']?' invalid':''}`} value={data.health?.emergencyPhone||''} onChange={e=>{ set('health', { ...data.health!, emergencyPhone: e.target.value }); setErrors(s=>({ ...s, ['health.emergencyPhone']: false })) }} />
                  </label>
                  <label className="field"><span className="label">Relationship to Student</span>
                    <input className="input" value={data.health?.relation||''} onChange={e=>set('health', { ...data.health!, relation: e.target.value })} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Transport & Fee Information</h3>
                <div className="grid">
                  <label className="field"><span className="label">Mode of Transport</span>
                    <select className="select" value={data.transport?.mode||''} onChange={e=>set('transport', { ...data.transport!, mode: e.target.value })}>
                      <option value="">Select</option>
                      <option>School Bus</option>
                      <option>Private</option>
                      <option>Walk</option>
                    </select>
                  </label>
                  <label className="field"><span className="label">Bus Route/Stop</span>
                    <input className="input" value={data.transport?.route||''} onChange={e=>set('transport', { ...data.transport!, route: e.target.value })} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Documents Submitted</h3>
                <div className="grid">
                  <label className="field" style={{display:'flex',alignItems:'center',gap:8}}>
                    <input type="checkbox" checked={!!data.documents?.tc} onChange={(e)=>set('documents', { ...data.documents!, tc: e.target.checked })} />
                    Transfer Certificate (TC)
                  </label>
                  <label className="field" style={{display:'flex',alignItems:'center',gap:8}}>
                    <input type="checkbox" checked={!!data.documents?.reportCard} onChange={(e)=>set('documents', { ...data.documents!, reportCard: e.target.checked })} />
                    Report Card
                  </label>
                  <label className="field" style={{display:'flex',alignItems:'center',gap:8}}>
                    <input type="checkbox" checked={!!data.documents?.aadhaar} onChange={(e)=>set('documents', { ...data.documents!, aadhaar: e.target.checked })} />
                    Aadhaar Copy
                  </label>
                  <label className="field" style={{display:'flex',alignItems:'center',gap:8}}>
                    <input type="checkbox" checked={!!data.documents?.photos} onChange={(e)=>set('documents', { ...data.documents!, photos: e.target.checked })} />
                    Passport-size Photos (2)
                  </label>
                  <label className="field"><span className="label">Other</span>
                    <input className="input" value={data.documents?.others||''} onChange={(e)=>set('documents', { ...data.documents!, others: e.target.value })} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Declaration</h3>
                <p className="note">I hereby declare that all information provided above is true and correct to the best of my knowledge. I agree to ensure my ward follows all school rules, maintains discipline, and participates in academic and co-curricular activities.</p>
                <label className="field" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <input name="declaration.agree" type="checkbox" checked={data.declaration?.agree||false} onChange={(e) => { set('declaration', { agree: e.target.checked }); setErrors(s=>({ ...s, ['declaration.agree']: false })) }} />
                  I agree to the above declaration.
                </label>
                {errors['declaration.agree'] ? <span className="error">Please accept the declaration</span> : null}
              </div>

              <div className="actions">
                <button className="button" type="submit" disabled={submitting}>{submitting? 'Submitting…' : 'Submit to Admissions'}</button>
                <Link className="button secondary" href="/">Back</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

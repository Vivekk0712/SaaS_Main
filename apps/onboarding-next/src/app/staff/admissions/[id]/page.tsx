"use client"
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL || ''

type AppDoc = { id?: string; _id?: { $oid?: string }; parentPhone: string; data: any; status: string }

export default function StaffAdmissionEdit({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [app, setApp] = React.useState<AppDoc | null>(null)
  const [data, setData] = React.useState<any>({})
  const [errors] = React.useState<Record<string, boolean>>({})

  const load = async () => {
    try {
      setLoading(true)
      const r = API
        ? await fetch(`${API}/v1/onboarding/applications/${params.id}`)
        : await fetch(`/api/local/staff/applications/${params.id}`)
      const j = await r.json()
      setApp(j)
      setData(j?.data || {})
    } catch { setApp(null) } finally { setLoading(false) }
  }

  React.useEffect(() => { load() }, [params.id])

  const set = <T extends any>(path: string, value: T) => {
    setData((d: any) => {
      const copy = { ...d }
      const keys = path.split('.')
      let cur: any = copy
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i]
        cur[k] = cur[k] || {}
        cur = cur[k]
      }
      cur[keys[keys.length - 1]] = value
      return copy
    })
  }

  const onPhoto = (file?: File) => {
    if (!file) return
    const r = new FileReader()
    r.onload = () => set('photoDataUrl', String(r.result || ''))
    r.readAsDataURL(file)
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const body = JSON.stringify({ application: data })
      if (API) {
        const r = await fetch(`${API}/v1/onboarding/staff/applications/${params.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json', 'x-role': 'admissions', 'x-password': '12345' }, body })
        if (!r.ok) throw new Error('save_failed')
      } else {
        const rl = await fetch(`/api/local/staff/applications/${params.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body })
        if (!rl.ok) throw new Error('save_failed_local')
      }
      alert('Saved')
      router.push('/staff/admissions')
    } catch { alert('Save failed') } finally { setSaving(false) }
  }

  if (loading) return <div className="container"><div className="card">Loading…</div></div>
  if (!app) return <div className="container"><div className="card">Not found</div></div>

  return (
    <div className="container">
      <div className="hero-card" style={{ marginBottom: 16 }}>
        <h1 className="title">Admissions — Edit Application</h1>
        <p className="subtitle">This is the same form, prefilled from the parent’s submission. Make necessary corrections and save.</p>
        <div style={{marginTop:8}}>
          <Link className="button" href={`/staff/admissions/${params.id}/fees`}>Edit Fees & Installments</Link>
        </div>
      </div>
      <div className="paper-wrap">
        <div className="paper relative">
          <header>
            <div className="brand">SCHOOL SAS</div>
            <div className="meta">Application Form • Edit Mode</div>
          </header>
          <div className="photo-box">
            {data.photoDataUrl ? <img src={data.photoDataUrl} alt="Passport" /> : <span style={{ color: '#64748b', fontSize: 12 }}>Passport Photo</span>}
          </div>
          <div className="body">
            <form onSubmit={onSave}>
              <div className="section">
                <h3>Admission Details</h3>
                <div className="grid">
                  <label className="field"><span className="label">Admission Number</span>
                    <input className="input" placeholder="Auto/Manual" value={data.admission?.number||''} onChange={e=>set('admission.number', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Date of Admission</span>
                    <input type="date" className="input" value={data.admission?.date||''} onChange={e=>set('admission.date', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Academic Year</span>
                    <input className={`input${errors['admission.year']?' invalid':''}`} placeholder="2025-26" value={data.admission?.year||''} onChange={e=>set('admission.year', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Grade Applied For</span>
                    <select className={`select${errors['admission.grade']?' invalid':''}`} value={data.admission?.grade||''} onChange={e=>set('admission.grade', e.target.value)}>
                      <option value="">Select</option>
                      {['Nursery','LKG','UKG',...Array.from({length:12},(_,i)=>String(i+1))].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </label>
                  <label className="field"><span className="label">Section (if allotted)</span>
                    <input className="input" value={data.admission?.section||''} onChange={e=>set('admission.section', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Category</span>
                    <input className="input" value={data.admission?.category||''} onChange={e=>set('admission.category', e.target.value)} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Student Details</h3>
                <div className="grid">
                  <label className="field"><span className="label">First Name</span>
                    <input className={`input${errors['student.firstName']?' invalid':''}`} value={data.student?.firstName||''} onChange={e=>set('student.firstName', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Last Name</span>
                    <input className="input" value={data.student?.lastName||''} onChange={e=>set('student.lastName', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Date of Birth</span>
                    <input type="date" className={`input${errors['student.dob']?' invalid':''}`} value={data.student?.dob||''} onChange={e=>set('student.dob', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Gender</span>
                    <select className={`select${errors['student.gender']?' invalid':''}`} value={data.student?.gender||''} onChange={e=>set('student.gender', e.target.value)}>
                      <option value="">Select</option>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label className="field"><span className="label">Nationality</span>
                    <input className="input" value={data.student?.nationality||''} onChange={e=>set('student.nationality', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Religion</span>
                    <input className="input" value={data.student?.religion||''} onChange={e=>set('student.religion', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Caste/Community</span>
                    <input className="input" value={data.student?.caste||''} onChange={e=>set('student.caste', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Languages Known</span>
                    <input className="input" placeholder="English, Hindi, Kannada" value={data.student?.languages||''} onChange={e=>set('student.languages', e.target.value)} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Addresses</h3>
                <div className="grid">
                  <label className="field"><span className="label">Permanent Address</span>
                    <textarea className="textarea" value={data.address?.permanent||''} onChange={e=>set('address.permanent', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Correspondence Address</span>
                    <textarea className="textarea" value={data.address?.correspondence||''} onChange={e=>set('address.correspondence', e.target.value)} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Parent / Guardian Details</h3>
                <div className="grid">
                  <label className="field"><span className="label">Father's Name</span>
                    <input className="input" value={data.guardians?.father||''} onChange={e=>set('guardians.father', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Father Occupation</span>
                    <input className="input" value={data.guardians?.fatherOccupation||''} onChange={e=>set('guardians.fatherOccupation', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Father Phone</span>
                    <input className="input" value={data.guardians?.fatherPhone||''} onChange={e=>set('guardians.fatherPhone', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Father Email</span>
                    <input className="input" value={data.guardians?.fatherEmail||''} onChange={e=>set('guardians.fatherEmail', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Mother's Name</span>
                    <input className="input" value={data.guardians?.mother||''} onChange={e=>set('guardians.mother', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Mother Occupation</span>
                    <input className="input" value={data.guardians?.motherOccupation||''} onChange={e=>set('guardians.motherOccupation', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Mother Phone</span>
                    <input className="input" value={data.guardians?.motherPhone||''} onChange={e=>set('guardians.motherPhone', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Mother Email</span>
                    <input className="input" value={data.guardians?.motherEmail||''} onChange={e=>set('guardians.motherEmail', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Local Guardian (if any)</span>
                    <input className="input" value={data.guardians?.guardian||''} onChange={e=>set('guardians.guardian', e.target.value)} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Previous School</h3>
                <div className="grid">
                  <label className="field"><span className="label">School Name</span>
                    <input className="input" value={data.previousSchool?.name||''} onChange={e=>set('previousSchool.name', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Board</span>
                    <input className="input" value={data.previousSchool?.board||''} onChange={e=>set('previousSchool.board', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Last Grade</span>
                    <input className="input" value={data.previousSchool?.lastGrade||''} onChange={e=>set('previousSchool.lastGrade', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Year of Completion</span>
                    <input className="input" value={data.previousSchool?.yearOfCompletion||''} onChange={e=>set('previousSchool.yearOfCompletion', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Reason for Transfer</span>
                    <input className="input" value={data.previousSchool?.reason||''} onChange={e=>set('previousSchool.reason', e.target.value)} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Health and Emergency Information</h3>
                <div className="grid">
                  <label className="field"><span className="label">Blood Group</span>
                    <input className="input" value={data.health?.bloodGroup||''} onChange={e=>set('health.bloodGroup', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Known Allergies</span>
                    <input className="input" value={data.health?.allergies||''} onChange={e=>set('health.allergies', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Existing Medical Conditions</span>
                    <input className="input" value={data.health?.conditions||''} onChange={e=>set('health.conditions', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Emergency Contact Name</span>
                    <input className="input" value={data.health?.emergencyName||''} onChange={e=>set('health.emergencyName', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Emergency Contact Number</span>
                    <input className="input" value={data.health?.emergencyPhone||''} onChange={e=>set('health.emergencyPhone', e.target.value)} />
                  </label>
                  <label className="field"><span className="label">Relationship to Student</span>
                    <input className="input" value={data.health?.relation||''} onChange={e=>set('health.relation', e.target.value)} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Transport & Fee Information</h3>
                <div className="grid">
                  <label className="field"><span className="label">Mode of Transport</span>
                    <select className="select" value={data.transport?.mode||''} onChange={e=>set('transport.mode', e.target.value)}>
                      <option value="">Select</option>
                      <option>School Bus</option>
                      <option>Private</option>
                      <option>Walk</option>
                    </select>
                  </label>
                  <label className="field"><span className="label">Bus Route/Stop</span>
                    <input className="input" value={data.transport?.route||''} onChange={e=>set('transport.route', e.target.value)} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Documents Submitted</h3>
                <div className="grid">
                  <label className="field" style={{display:'flex',alignItems:'center',gap:8}}>
                    <input type="checkbox" checked={!!data.documents?.tc} onChange={(e)=>set('documents.tc', e.target.checked)} />
                    Transfer Certificate (TC)
                  </label>
                  <label className="field" style={{display:'flex',alignItems:'center',gap:8}}>
                    <input type="checkbox" checked={!!data.documents?.reportCard} onChange={(e)=>set('documents.reportCard', e.target.checked)} />
                    Report Card
                  </label>
                  <label className="field" style={{display:'flex',alignItems:'center',gap:8}}>
                    <input type="checkbox" checked={!!data.documents?.aadhaar} onChange={(e)=>set('documents.aadhaar', e.target.checked)} />
                    Aadhaar Copy
                  </label>
                  <label className="field" style={{display:'flex',alignItems:'center',gap:8}}>
                    <input type="checkbox" checked={!!data.documents?.photos} onChange={(e)=>set('documents.photos', e.target.checked)} />
                    Passport-size Photos (2)
                  </label>
                  <label className="field"><span className="label">Other</span>
                    <input className="input" value={data.documents?.others||''} onChange={(e)=>set('documents.others', e.target.value)} />
                  </label>
                </div>
              </div>

              <div className="section">
                <h3>Declaration</h3>
                <p className="note">Admissions staff may update details as per documentation. Parent acceptance is kept as submitted.</p>
                <label className="field" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={!!data.declaration?.agree} onChange={(e) => set('declaration.agree', e.target.checked)} />
                  Parent agreed to declaration
                </label>
              </div>

              <div className="actions">
                <button className="button" type="submit" disabled={saving}>{saving? 'Saving…' : 'Save Changes'}</button>
                <label className="button secondary" style={{ display:'inline-flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  Upload/Change Photo
                  <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>onPhoto(e.target.files?.[0])} />
                </label>
                <Link className="button secondary" href="/staff/admissions">Back</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

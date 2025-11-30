"use client"
import React from 'react'

type FormData = {
  admission: {
    grade: string
    year: string
    category: string
  }
  student: {
    firstName: string
    lastName: string
    dob: string
    gender: string
    nationality: string
    idNumber: string
  }
  address: {
    line1: string
    line2: string
    city: string
    state: string
    postalCode: string
  }
  guardians: {
    fatherName: string
    motherName: string
    phone: string
    email: string
    occupation: string
  }
  previousSchool: {
    name: string
    lastGrade: string
    yearsAttended: string
  }
  health: {
    bloodGroup: string
    allergies: string
    medicalConditions: string
    emergencyContact: string
  }
  transport: {
    needsBus: string
    pickupPoint: string
    feePlan: string
  }
  technology: {
    deviceAtHome: string
    internetAtHome: string
    consents: {
      photo: boolean
      terms: boolean
    }
  }
  documents: {
    idProof: string
    addressProof: string
    transferCert: string
  }
  declaration: { agree: boolean }
}

export default function AdmissionsApplicationForm() {
  const [data, setData] = React.useState<FormData>({
    admission: { grade: '', year: '', category: '' },
    student: { firstName: '', lastName: '', dob: '', gender: '', nationality: '', idNumber: '' },
    address: { line1: '', line2: '', city: '', state: '', postalCode: '' },
    guardians: { fatherName: '', motherName: '', phone: '', email: '', occupation: '' },
    previousSchool: { name: '', lastGrade: '', yearsAttended: '' },
    health: { bloodGroup: '', allergies: '', medicalConditions: '', emergencyContact: '' },
    transport: { needsBus: 'no', pickupPoint: '', feePlan: '' },
    technology: { deviceAtHome: 'yes', internetAtHome: 'yes', consents: { photo: false, terms: false } },
    documents: { idProof: '', addressProof: '', transferCert: '' },
    declaration: { agree: false },
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setData((d) => ({ ...d, [key]: value }))

  const required = (path: string, value: string | boolean) => {
    if ((typeof value === 'string' && !value.trim()) || value === false) {
      return `${path} is required`
    }
    return ''
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    // Minimal required fields
    e.grade = required('Grade', data.admission.grade)
    e.year = required('Academic year', data.admission.year)
    e.firstName = required('First name', data.student.firstName)
    e.lastName = required('Last name', data.student.lastName)
    e.dob = required('Date of birth', data.student.dob)
    e.phone = required('Guardian phone', data.guardians.phone)
    e.email = required('Guardian email', data.guardians.email)
    e.address1 = required('Address line 1', data.address.line1)
    e.city = required('City', data.address.city)
    e.postalCode = required('Postal code', data.address.postalCode)
    e.agree = data.declaration.agree ? '' : 'You must agree to the declaration'
    Object.keys(e).forEach((k) => { if (!e[k]) delete e[k] })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    console.log('Application payload', data)
    try {
      const response = await fetch('http://localhost:3005/v1/onboarding/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-parent-phone': '123-456-7890',
        },
        body: JSON.stringify({ application: data }),
      })
      const result = await response.json()
      console.log('Application submission result', result)
      alert('Application submitted. Your details have been captured.')
    } catch (error) {
      console.error('Application submission error', error)
      alert('There was an error submitting your application. Please try again.')
    }
  }

  return (
    <div className="container">
      <form className="card" onSubmit={onSubmit}>
        <h1 className="title">Student Onboarding — Application Form</h1>
        <p className="subtitle">Please fill in all applicable details. Fields marked required must be completed.</p>

        <div className="section">
          <h2>Admission Details</h2>
          <div className="grid">
            <div className="field">
              <label className="label" htmlFor="grade">Grade Applying For</label>
              <select id="grade" className="select" value={data.admission.grade} onChange={(e) => set('admission', { ...data.admission, grade: e.target.value })}>
                <option value="">Select grade</option>
                <option>Nursery</option>
                <option>LKG</option>
                <option>UKG</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
                <option>6</option>
                <option>7</option>
                <option>8</option>
                <option>9</option>
                <option>10</option>
                <option>11</option>
                <option>12</option>
              </select>
              {errors.grade && <span className="error">{errors.grade}</span>}
            </div>
            <div className="field">
              <label className="label" htmlFor="year">Academic Year</label>
              <input id="year" className="input" placeholder="2025-26" value={data.admission.year} onChange={(e) => set('admission', { ...data.admission, year: e.target.value })} />
              {errors.year && <span className="error">{errors.year}</span>}
            </div>
            <div className="field">
              <label className="label" htmlFor="category">Admission Category</label>
              <select id="category" className="select" value={data.admission.category} onChange={(e) => set('admission', { ...data.admission, category: e.target.value })}>
                <option value="">Select category</option>
                <option>General</option>
                <option>Sibling</option>
                <option>Alumni</option>
                <option>RTE</option>
              </select>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Student Personal Information</h2>
          <div className="grid">
            <div className="field">
              <label className="label" htmlFor="firstName">First Name</label>
              <input id="firstName" className="input" value={data.student.firstName} onChange={(e) => set('student', { ...data.student, firstName: e.target.value })} />
              {errors.firstName && <span className="error">{errors.firstName}</span>}
            </div>
            <div className="field">
              <label className="label" htmlFor="lastName">Last Name</label>
              <input id="lastName" className="input" value={data.student.lastName} onChange={(e) => set('student', { ...data.student, lastName: e.target.value })} />
              {errors.lastName && <span className="error">{errors.lastName}</span>}
            </div>
            <div className="field">
              <label className="label" htmlFor="dob">Date of Birth</label>
              <input id="dob" type="date" className="input" value={data.student.dob} onChange={(e) => set('student', { ...data.student, dob: e.target.value })} />
              {errors.dob && <span className="error">{errors.dob}</span>}
            </div>
            <div className="field">
              <label className="label" htmlFor="gender">Gender</label>
              <select id="gender" className="select" value={data.student.gender} onChange={(e) => set('student', { ...data.student, gender: e.target.value })}>
                <option value="">Select</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="nationality">Nationality</label>
              <input id="nationality" className="input" value={data.student.nationality} onChange={(e) => set('student', { ...data.student, nationality: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="idNumber">Govt ID / Aadhaar (optional)</label>
              <input id="idNumber" className="input" value={data.student.idNumber} onChange={(e) => set('student', { ...data.student, idNumber: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Address Details</h2>
          <div className="grid">
            <div className="field">
              <label className="label" htmlFor="line1">Address Line 1</label>
              <input id="line1" className="input" value={data.address.line1} onChange={(e) => set('address', { ...data.address, line1: e.target.value })} />
              {errors.address1 && <span className="error">{errors.address1}</span>}
            </div>
            <div className="field">
              <label className="label" htmlFor="line2">Address Line 2</label>
              <input id="line2" className="input" value={data.address.line2} onChange={(e) => set('address', { ...data.address, line2: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="city">City</label>
              <input id="city" className="input" value={data.address.city} onChange={(e) => set('address', { ...data.address, city: e.target.value })} />
              {errors.city && <span className="error">{errors.city}</span>}
            </div>
            <div className="field">
              <label className="label" htmlFor="state">State</label>
              <input id="state" className="input" value={data.address.state} onChange={(e) => set('address', { ...data.address, state: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="postalCode">Postal Code</label>
              <input id="postalCode" className="input" value={data.address.postalCode} onChange={(e) => set('address', { ...data.address, postalCode: e.target.value })} />
              {errors.postalCode && <span className="error">{errors.postalCode}</span>}
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Parent/Guardian Information</h2>
          <div className="grid">
            <div className="field">
              <label className="label" htmlFor="fatherName">Father/Guardian Name</label>
              <input id="fatherName" className="input" value={data.guardians.fatherName} onChange={(e) => set('guardians', { ...data.guardians, fatherName: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="motherName">Mother/Guardian Name</label>
              <input id="motherName" className="input" value={data.guardians.motherName} onChange={(e) => set('guardians', { ...data.guardians, motherName: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="phone">Primary Phone</label>
              <input id="phone" className="input" value={data.guardians.phone} onChange={(e) => set('guardians', { ...data.guardians, phone: e.target.value })} />
              {errors.phone && <span className="error">{errors.phone}</span>}
            </div>
            <div className="field">
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" className="input" value={data.guardians.email} onChange={(e) => set('guardians', { ...data.guardians, email: e.target.value })} />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>
            <div className="field">
              <label className="label" htmlFor="occupation">Occupation</label>
              <input id="occupation" className="input" value={data.guardians.occupation} onChange={(e) => set('guardians', { ...data.guardians, occupation: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Previous School Details</h2>
          <div className="grid">
            <div className="field">
              <label className="label" htmlFor="schoolName">School Name</label>
              <input id="schoolName" className="input" value={data.previousSchool.name} onChange={(e) => set('previousSchool', { ...data.previousSchool, name: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="lastGrade">Last Grade Completed</label>
              <input id="lastGrade" className="input" value={data.previousSchool.lastGrade} onChange={(e) => set('previousSchool', { ...data.previousSchool, lastGrade: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="yearsAttended">Years Attended</label>
              <input id="yearsAttended" className="input" value={data.previousSchool.yearsAttended} onChange={(e) => set('previousSchool', { ...data.previousSchool, yearsAttended: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Health & Emergency Information</h2>
          <div className="grid">
            <div className="field">
              <label className="label" htmlFor="bloodGroup">Blood Group</label>
              <input id="bloodGroup" className="input" value={data.health.bloodGroup} onChange={(e) => set('health', { ...data.health, bloodGroup: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="allergies">Allergies</label>
              <input id="allergies" className="input" value={data.health.allergies} onChange={(e) => set('health', { ...data.health, allergies: e.target.value })} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="medicalConditions">Medical Conditions</label>
              <textarea id="medicalConditions" className="textarea" value={data.health.medicalConditions} onChange={(e) => set('health', { ...data.health, medicalConditions: e.target.value })} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="emergencyContact">Emergency Contact (Name & Phone)</label>
              <input id="emergencyContact" className="input" value={data.health.emergencyContact} onChange={(e) => set('health', { ...data.health, emergencyContact: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Transport & Fee Information</h2>
          <div className="grid">
            <div className="field">
              <label className="label" htmlFor="needsBus">Requires School Bus</label>
              <select id="needsBus" className="select" value={data.transport.needsBus} onChange={(e) => set('transport', { ...data.transport, needsBus: e.target.value })}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="pickupPoint">Pickup Point</label>
              <input id="pickupPoint" className="input" value={data.transport.pickupPoint} onChange={(e) => set('transport', { ...data.transport, pickupPoint: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="feePlan">Fee Plan</label>
              <select id="feePlan" className="select" value={data.transport.feePlan} onChange={(e) => set('transport', { ...data.transport, feePlan: e.target.value })}>
                <option value="">Select</option>
                <option>Annual</option>
                <option>Quarterly</option>
                <option>Monthly</option>
              </select>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Technology & Consent</h2>
          <div className="grid">
            <div className="field">
              <label className="label" htmlFor="deviceAtHome">Device at Home</label>
              <select id="deviceAtHome" className="select" value={data.technology.deviceAtHome} onChange={(e) => set('technology', { ...data.technology, deviceAtHome: e.target.value })}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="internetAtHome">Internet at Home</label>
              <select id="internetAtHome" className="select" value={data.technology.internetAtHome} onChange={(e) => set('technology', { ...data.technology, internetAtHome: e.target.value })}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
          <div className="grid" style={{ marginTop: 8 }}>
            <label className="field" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={data.technology.consents.photo} onChange={(e) => set('technology', { ...data.technology, consents: { ...data.technology.consents, photo: e.target.checked } })} />
              Photo/Media consent
            </label>
            <label className="field" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={data.technology.consents.terms} onChange={(e) => set('technology', { ...data.technology, consents: { ...data.technology.consents, terms: e.target.checked } })} />
              Accept technology usage policy
            </label>
          </div>
        </div>

        <div className="section">
          <h2>Documents Submitted (links or notes)</h2>
          <div className="grid">
            <div className="field">
              <label className="label" htmlFor="idProof">ID Proof</label>
              <input id="idProof" className="input" placeholder="Drive link / Ref no." value={data.documents.idProof} onChange={(e) => set('documents', { ...data.documents, idProof: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="addressProof">Address Proof</label>
              <input id="addressProof" className="input" placeholder="Drive link / Ref no." value={data.documents.addressProof} onChange={(e) => set('documents', { ...data.documents, addressProof: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="transferCert">Transfer Certificate</label>
              <input id="transferCert" className="input" placeholder="Drive link / Ref no." value={data.documents.transferCert} onChange={(e) => set('documents', { ...data.documents, transferCert: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Declaration</h2>
          <label className="field" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={data.declaration.agree} onChange={(e) => set('declaration', { agree: e.target.checked })} />
            I confirm the information provided is true and complete.
          </label>
          {errors.agree && <span className="error">{errors.agree}</span>}
        </div>

        <div className="actions">
          <button type="submit" className="btn">Submit Application</button>
          <span className="subtitle">Demo only: data prints to console.</span>
        </div>
      </form>
    </div>
  )
}


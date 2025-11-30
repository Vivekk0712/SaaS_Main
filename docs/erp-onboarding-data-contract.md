# ERP Onboarding Data Contract (Draft)

This document defines the payloads produced by the Student Onboarding module. These payloads are designed for idempotent upserts to the ERP. All objects include `externalId` and `updatedAt` for reconciliation.

## 1) Application (aggregated)
```json
{
  "externalId": "APP-2025-000123",
  "status": "approved",
  "academicYear": "2025-2026",
  "gradeApplied": "Grade 8",
  "section": "A",
  "submittedAt": "2025-05-03T10:12:44Z",
  "decidedAt": "2025-05-05T09:00:00Z"
}
```

## 2) Student (basic record; roster assigned later by HOD)
```json
{
  "externalId": "STU-APP-2025-000123",
  "fullName": "Rahul Sharma",
  "dob": "2010-03-15",
  "gender": "Male",
  "nationality": "Indian",
  "religion": "Hindu",
  "casteCommunity": "General",
  "languages": ["English", "Hindi", "Kannada"],
  "photoUrl": "https://files.example/signed/students/rahul.jpg",
  "health": {
    "bloodGroup": "B+ve",
    "allergies": ["Peanuts"],
    "medicalConditions": []
  },
  "emergency": {
    "name": "Ravi Sharma",
    "phone": "+91 9998887776",
    "relation": "Uncle"
  },
  "address": {
    "permanent": "123 Green Valley, Bangalore, Karnataka - 560034",
    "correspondence": "Same as above",
    "city": "Bangalore",
    "state": "Karnataka",
    "country": "India",
    "pin": "560034"
  },
  "previousSchool": {
    "schoolName": "Green Valley School",
    "board": "CBSE",
    "lastGrade": "7",
    "yearOfCompletion": 2024,
    "reasonForTransfer": "Relocation"
  },
  "transport": {
    "mode": "School Bus",
    "route": "Green Valley Main Stop"
  }
}
```

## 3) Parents/Guardians
```json
[
  {
    "externalId": "PAR-APP-2025-000123-F",
    "relation": "Father",
    "name": "Ramesh Sharma",
    "occupation": "Software Engineer",
    "phone": "+91 9876501234",
    "email": "ramesh.sharma@example.com",
    "portalUserId": "user_abc123"
  },
  {
    "externalId": "PAR-APP-2025-000123-M",
    "relation": "Mother",
    "name": "Suman Sharma",
    "occupation": "Teacher",
    "phone": "+91 9876512345",
    "email": "suman.sharma@example.com",
    "portalUserId": "user_def456"
  }
]
```

## 4) Fee Schedule / Invoice Seed
```json
{
  "externalId": "FEE-APP-2025-000123",
  "studentExternalId": "STU-APP-2025-000123",
  "heads": [
    { "code": "SCHOOL_FEE", "label": "School Fee", "amount": 30000 },
    { "code": "LIBRARY_FEE", "label": "Library Fee", "amount": 1500 },
    { "code": "SKILL_FEE", "label": "Skill Fee", "amount": 2500 },
    { "code": "TRANSPORT_FEE", "label": "Transport Fee", "amount": 6000 }
  ],
  "discounts": [],
  "total": 40000,
  "installmentPlan": {
    "count": 3,
    "schedule": [
      { "due": "2025-06-01", "amount": 15000 },
      { "due": "2025-09-01", "amount": 15000 },
      { "due": "2025-12-01", "amount": 10000 }
    ]
  },
  "firstPaymentLink": {
    "url": "https://pay.example/p/xyz",
    "invoiceId": "INV-001-APP-2025-000123"
  }
}
```

## 5) Roster Assignment (from HOD module)
```json
{
  "event": "roster.assignment.completed",
  "studentExternalId": "STU-APP-2025-000123",
  "classId": "GRADE8",
  "sectionId": "A",
  "rollNo": "8A-023",
  "start": "2025-06-01"
}
```

## Idempotency & Reconciliation
- All POSTs to ERP use `Idempotency-Key: <externalId>`.
- ERP should upsert on `externalId` and return the canonical `id` mapping.
- Onboarding retains a mapping table `{ externalId -> erpId, lastSyncedAt }` and a retry queue.
 - For roster: Onboarding emits `roster.assignment.requested` and awaits `roster.assignment.completed` from HOD before updating the student record and notifying parents.

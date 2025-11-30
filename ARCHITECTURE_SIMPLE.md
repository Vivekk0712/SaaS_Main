# School ERP - Simple Architecture Diagram

## 🎯 What Happens When You Run `npm run dev:stack`

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR TERMINAL                                │
│                                                                 │
│  > npm run dev:stack                                            │
│                                                                 │
│  [dev] starting study-service...         ✅ Port 3002          │
│  [dev] starting onboarding-service...    ✅ Port 3005          │
│  [dev] starting frontend-next...         ✅ Port 3000          │
│  [dev] starting onboarding-next...       ✅ Port 3020          │
│  [dev] starting students-next...         ✅ Port 3030          │
└─────────────────────────────────────────────────────────────────┘
```

## 🌐 What You Can Access in Your Browser

```
┌──────────────────────────────────────────────────────────────────┐
│                         YOUR BROWSER                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📱 http://localhost:3000  →  Main School Portal                │
│     ├─ /admin       → Admin Dashboard                           │
│     ├─ /teacher     → Teacher Portal (Attendance, Marks)        │
│     ├─ /student     → Student Portal (View Grades)              │
│     ├─ /parent      → Parent Portal (View Child's Progress)     │
│     ├─ /accountant  → Accountant Portal (Fees)                  │
│     └─ /principal   → Principal Portal (Approvals)              │
│                                                                  │
│  📱 http://localhost:3020  →  Onboarding Portal                 │
│     ├─ Parent Signup                                            │
│     ├─ Student Application Form                                 │
│     └─ Admissions Staff Review                                  │
│                                                                  │
│  📱 http://localhost:3030  →  Students Portal                   │
│     └─ Simplified Student Dashboard                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 🏗 How the System Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                               │
│                    (What Users See)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Main Portal  │  │ Onboarding   │  │  Students    │         │
│  │   (3000)     │  │   (3020)     │  │   (3030)     │         │
│  │              │  │              │  │              │         │
│  │  Next.js     │  │  Next.js     │  │  Next.js     │         │
│  │  React       │  │  React       │  │  React       │         │
│  │  TypeScript  │  │  TypeScript  │  │  TypeScript  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                  │
└─────────┼─────────────────┼─────────────────┼──────────────────┘
          │                 │                 │
          │ HTTP Requests   │                 │
          ↓                 ↓                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                                │
│                    (Business Logic)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐      ┌──────────────────────┐        │
│  │   Study Service      │      │ Onboarding Service   │        │
│  │      (3002)          │      │      (3005)          │        │
│  │                      │      │                      │        │
│  │  Express.js          │      │  Express.js          │        │
│  │  TypeScript          │      │  TypeScript          │        │
│  │                      │      │                      │        │
│  │  Handles:            │      │  Handles:            │        │
│  │  • Classes           │      │  • Parent Signup     │        │
│  │  • Students          │      │  • Applications      │        │
│  │  • Attendance        │      │  • Admissions        │        │
│  │  • Marks             │      │  • Document Upload   │        │
│  │  • Assignments       │      │                      │        │
│  │  • Diary             │      │                      │        │
│  └──────────┬───────────┘      └──────────┬───────────┘        │
│             │                             │                    │
└─────────────┼─────────────────────────────┼────────────────────┘
              │                             │
              │ Database Queries            │
              ↓                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                               │
│                    (Data Storage)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │           MongoDB (localhost:27017)              │          │
│  │           Database: school-sas                   │          │
│  │                                                  │          │
│  │  Collections:                                    │          │
│  │  • students      → Student records               │          │
│  │  • classes       → Class definitions             │          │
│  │  • sections      → Section assignments           │          │
│  │  • attendance    → Attendance records            │          │
│  │  • grades        → Marks and grades              │          │
│  │  • assignments   → Homework                      │          │
│  │  • diaries       → Daily diary entries           │          │
│  │  • applications  → Admission applications        │          │
│  │  • parents       → Parent information            │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │           MySQL (localhost:3306)                 │          │
│  │           Database: sas                          │          │
│  │           (Optional - Not Currently Used)        │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Example: Teacher Marks Attendance

```
1. Teacher opens browser
   → http://localhost:3000/teacher/attendance

2. Frontend (Main Portal - Port 3000)
   ↓ Sends HTTP POST request
   
3. Backend (Study Service - Port 3002)
   → Receives: POST /v1/attendance
   → Validates data
   → Processes business logic
   ↓ Saves to database
   
4. Database (MongoDB)
   → Stores in 'attendance' collection
   ↓ Returns success
   
5. Backend (Study Service)
   → Returns success response
   ↓ Sends JSON response
   
6. Frontend (Main Portal)
   → Updates UI
   → Shows "Attendance marked successfully!"
```

## 🔄 Example: Parent Submits Application

```
1. Parent opens browser
   → http://localhost:3020/application

2. Frontend (Onboarding Portal - Port 3020)
   ↓ Sends HTTP POST request
   
3. Backend (Onboarding Service - Port 3005)
   → Receives: POST /v1/onboarding/applications
   → Validates application data
   → Processes documents
   ↓ Saves to database
   
4. Database (MongoDB)
   → Stores in 'applications' collection
   ↓ Returns success
   
5. Backend (Onboarding Service)
   → May call Study Service to create student
   → Returns success response
   ↓ Sends JSON response
   
6. Frontend (Onboarding Portal)
   → Updates UI
   → Shows "Application submitted successfully!"
```

## 📦 Project Structure Simplified

```
school-sas-monorepo/
│
├── apps/                          ← FRONTEND (What users see)
│   ├── frontend-next/             ← Main Portal (3000)
│   ├── onboarding-next/           ← Onboarding (3020)
│   └── students-next/             ← Students (3030)
│
├── services/                      ← BACKEND (Business logic)
│   ├── study-service/             ← Academic APIs (3002)
│   └── onboarding-service/        ← Admissions APIs (3005)
│
├── packages/                      ← SHARED CODE
│   └── shared-lib/                ← Common utilities
│
├── scripts/                       ← UTILITY SCRIPTS
│   └── dev-all.mjs                ← Runs everything!
│
└── docs/                          ← DOCUMENTATION
    └── ARCHITECTURE.md            ← Detailed design
```

## 🎯 Key Concepts

### 1. Monorepo
All apps and services in ONE repository. Benefits:
- Share code easily
- Install dependencies once
- Run everything together

### 2. Microservices
Each service handles one area:
- **Study Service** = Academic stuff
- **Onboarding Service** = Admissions stuff
- Each has its own database collections
- They can talk to each other via HTTP

### 3. Frontend-Backend Separation
- **Frontend** (Next.js): User interface, forms, displays
- **Backend** (Express): Business logic, validation, database
- They communicate via HTTP/REST APIs

### 4. Database Collections (MongoDB)
Think of collections like Excel sheets:
- `students` sheet → All student records
- `classes` sheet → All class definitions
- `attendance` sheet → All attendance records

## 🚀 What `npm run dev:stack` Actually Does

```javascript
// This is what happens internally:

1. Start Study Service:
   npm run dev -w @school-sas/study-service
   → Connects to MongoDB
   → Starts Express server on port 3002
   → Ready to handle API requests

2. Start Onboarding Service:
   npm run dev -w @school-sas/onboarding-service
   → Connects to MongoDB
   → Starts Express server on port 3005
   → Ready to handle API requests

3. Start Main Portal:
   npm run dev -w frontend-next
   → Starts Next.js dev server on port 3000
   → Ready to serve web pages

4. Start Onboarding Portal:
   npm run dev -w onboarding-next
   → Starts Next.js dev server on port 3020
   → Ready to serve web pages

5. Start Students Portal:
   npm run dev -w students-next
   → Starts Next.js dev server on port 3030
   → Ready to serve web pages

All running simultaneously! ✨
```

## 🎓 Summary

**One Command:**
```cmd
npm run dev:stack
```

**Starts:**
- 2 Backend Services (APIs)
- 3 Frontend Apps (Websites)

**Uses:**
- MongoDB (auto-created)
- TypeScript (everywhere)
- Express (backend)
- Next.js (frontend)

**Access:**
- Main: http://localhost:3000
- Onboarding: http://localhost:3020
- Students: http://localhost:3030

**That's it!** 🎉

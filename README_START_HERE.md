# 🎓 School ERP System - START HERE

## 👋 Welcome!

Your friend built a **School Management ERP System** using modern web technologies. This guide will help you understand and run it.

---

## 🎯 What Is This Project?

A complete school management system with:
- **Student admissions** (online applications)
- **Academic management** (attendance, marks, assignments)
- **Multiple portals** (Admin, Teacher, Student, Parent, Accountant, Principal)
- **Microservices architecture** (separate backend services)

---

## 🛠 What's It Built With?

### Frontend (What You See)
- **Next.js** - React framework for building websites
- **TypeScript** - JavaScript with types (safer code)
- **React** - UI library
- **Framer Motion** - Animations

### Backend (Behind the Scenes)
- **Express.js** - Web server framework
- **TypeScript** - Type-safe JavaScript
- **Node.js** - JavaScript runtime

### Database
- **MongoDB** - NoSQL database (currently used)
- **MySQL** - SQL database (optional, documented but not active)

### Architecture
- **Monorepo** - All code in one repository
- **Microservices** - Separate services for different features
- **npm workspaces** - Manages multiple packages

---

## ⚡ Quick Start (3 Steps)

### Step 1: Install Dependencies
```cmd
npm install
```
This installs everything needed for all apps and services.

### Step 2: Make Sure MongoDB is Running
```cmd
# Check if MongoDB is installed and running
mongosh --eval "db.version()"
```

If not installed: https://www.mongodb.com/try/download/community

### Step 3: Start Everything
```cmd
npm run dev:stack
```

**This ONE command starts:**
- ✅ Study Service (backend API - port 3002)
- ✅ Onboarding Service (backend API - port 3005)
- ✅ Main Portal (frontend - port 3000)
- ✅ Onboarding Portal (frontend - port 3020)
- ✅ Students Portal (frontend - port 3030)

### Step 4: Open Your Browser

| Portal | URL | What It Does |
|--------|-----|--------------|
| **Main Portal** | http://localhost:3000 | Admin, Teacher, Student, Parent dashboards |
| **Onboarding** | http://localhost:3020 | New student admissions |
| **Students** | http://localhost:3030 | Student-specific portal |

---

## 📁 Project Structure (Simplified)

```
school-sas-monorepo/
│
├── apps/                    ← FRONTEND WEBSITES
│   ├── frontend-next/       ← Main school portal (port 3000)
│   ├── onboarding-next/     ← Admissions site (port 3020)
│   └── students-next/       ← Student portal (port 3030)
│
├── services/                ← BACKEND APIs
│   ├── study-service/       ← Academic APIs (port 3002)
│   └── onboarding-service/  ← Admissions APIs (port 3005)
│
├── packages/                ← SHARED CODE
│   └── shared-lib/          ← Common utilities
│
├── scripts/                 ← UTILITY SCRIPTS
│   └── dev-all.mjs          ← Runs everything!
│
└── docs/                    ← DOCUMENTATION
```

---

## ❓ Common Questions

### Q1: Do I need to run each service separately?

**NO!** Just run:
```cmd
npm run dev:stack
```

This automatically starts all services and apps. Those individual commands like `npm run dev -w @school-sas/study-service` are only for debugging.

---

### Q2: What database should I use?

**Use MongoDB** (it's what's currently working).

The services are coded to use MongoDB. It auto-creates the database and collections when you run the app. No manual setup needed!

MySQL is documented but not actively used by the services.

---

### Q3: What are "services"?

**Services are backend APIs** that handle specific tasks:

**Study Service (Port 3002)**
- Manages classes, students, attendance
- Handles marks, assignments, diary
- Stores data in MongoDB

**Onboarding Service (Port 3005)**
- Handles parent signup and login
- Manages student applications
- Processes admissions workflow
- Stores data in MongoDB

Think of them as specialized workers that the frontend websites talk to.

---

### Q4: How does data flow?

```
User (Browser)
    ↓
Frontend Website (Next.js - Port 3000/3020/3030)
    ↓ HTTP Request
Backend Service (Express - Port 3002/3005)
    ↓ Database Query
MongoDB (Port 27017)
```

**Example**: Teacher marks attendance
1. Teacher fills form on http://localhost:3000/teacher/attendance
2. Frontend sends request to http://localhost:3002/v1/attendance
3. Study Service saves to MongoDB
4. Frontend shows "Success!"

---

### Q5: Where's the demo data?

**MongoDB starts empty.** You can:
- Add data through the UI
- Make API calls to create data
- The `data/local-db.json` file is currently empty

**For MySQL demo data** (optional):
```cmd
npm run db:seed
```
This creates 600 students, 50 teachers, and sample academic data in MySQL.

---

## 🎮 What Can You Do?

### Main Portal (http://localhost:3000)

**Admin** (`/admin`)
- Manage users and roles
- Configure system settings
- View reports

**Teacher** (`/teacher`)
- Mark attendance
- Enter marks (UT-1, UT-2, Mid-term, Final)
- Write diary entries
- Upload study materials
- Create calendar events
- Post circulars

**Student** (`/student`)
- View attendance
- Check marks and grades
- Access study materials
- Read diary and calendar

**Parent** (`/parent`)
- View child's attendance
- Check child's marks
- Read circulars
- Track progress

**Accountant** (`/accountant`)
- Manage fees
- Generate invoices
- Track payments

**Principal** (`/principal`)
- Approve applications
- View school-wide analytics
- Manage policies

### Onboarding Portal (http://localhost:3020)

**Parents**
- Sign up
- Submit student application
- Upload documents
- Track application status

**Admissions Staff**
- Review applications
- Request additional info
- Approve/reject applications

---

## 🔧 Troubleshooting

### MongoDB Connection Failed
```cmd
# Check if MongoDB is running
mongosh --eval "db.version()"

# Windows: Start MongoDB service
net start MongoDB

# Or use Docker
docker run -d -p 27017:27017 --name mongo mongo:latest
```

### Port Already in Use
```cmd
# Find what's using the port
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### Services Won't Start
1. Make sure MongoDB is running
2. Check if ports are available (3000, 3002, 3005, 3020, 3030)
3. Try `npm install` again
4. Check terminal for error messages

---

## 📚 Documentation Files

| File | What It Covers |
|------|----------------|
| **README_START_HERE.md** | This file - Quick overview |
| **SIMPLE_SETUP_GUIDE.md** | Detailed setup with Q&A |
| **ARCHITECTURE_SIMPLE.md** | Visual diagrams and flow |
| **PROJECT_GUIDE.md** | Complete technical guide |
| **docs/ARCHITECTURE.md** | Detailed system architecture |
| **docs/mysql-database.md** | MySQL schema and setup |
| **PRODUCT_EPICS.md** | Feature roadmap |

**Recommended Reading Order:**
1. This file (you're here!)
2. `SIMPLE_SETUP_GUIDE.md` - Answers your questions
3. `ARCHITECTURE_SIMPLE.md` - Visual understanding
4. `PROJECT_GUIDE.md` - Deep dive

---

## 🎯 Next Steps

1. **Run the project**
   ```cmd
   npm install
   npm run dev:stack
   ```

2. **Explore the portals**
   - Main: http://localhost:3000
   - Onboarding: http://localhost:3020
   - Students: http://localhost:3030

3. **Check the APIs**
   - Study Service: http://localhost:3002/healthz
   - Onboarding Service: http://localhost:3005/healthz

4. **Read the guides**
   - Start with `SIMPLE_SETUP_GUIDE.md`
   - Then check `ARCHITECTURE_SIMPLE.md`

5. **Explore the code**
   - Frontend: `apps/frontend-next/src/`
   - Backend: `services/study-service/src/`

---

## 💡 Key Takeaways

✅ **One command runs everything**: `npm run dev:stack`

✅ **MongoDB is used** (auto-creates database)

✅ **No need to run services separately** (they start automatically)

✅ **3 frontend apps + 2 backend services** = Complete system

✅ **TypeScript everywhere** (safer, better code)

✅ **Microservices architecture** (scalable, maintainable)

---

## 🚀 You're Ready!

```cmd
# Let's go!
npm install
npm run dev:stack
```

Then open http://localhost:3000 in your browser!

---

**Questions?** Check `SIMPLE_SETUP_GUIDE.md` for detailed answers!

**Need visuals?** See `ARCHITECTURE_SIMPLE.md` for diagrams!

**Want details?** Read `PROJECT_GUIDE.md` for everything!

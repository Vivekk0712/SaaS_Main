# 🔧 COMPLETE Setup Guide - Docker + Demo Data + Auth

## ⚠️ Important: Dual Database Architecture

Your friend's project uses **BOTH databases**:
- **MySQL** (port 3306) - Used by frontend for main data
- **MongoDB** (port 27017) - Used by backend services

---

## 🚀 QUICK START (Docker Compose - Recommended)

### Step 1: Start Databases with Docker Compose

```cmd
# Start both MySQL and MongoDB
docker-compose up -d

# Check if running
docker-compose ps
```

**What this does:**
- ✅ Starts MySQL on port 3306 (user: `sas_app`, password: `9482824040`)
- ✅ Starts MongoDB on port 27017
- ✅ Creates persistent volumes (data survives restarts)
- ✅ Auto-restarts containers if they crash

### Step 2: Build Shared Library

```cmd
# This fixes the "Cannot find module" error
npm run build -w @school-sas/shared-lib
```

### Step 3: Seed MySQL with Demo Data

```cmd
# Creates tables and seeds 600 students, 50 teachers, attendance, marks, etc.
node apps/frontend-next/scripts/seed-master.mjs
node apps/frontend-next/scripts/seed-dummy.mjs
node apps/frontend-next/scripts/seed-academics.mjs
```

**What you get:**
- 10 Classes (CLASS 1 to CLASS 10)
- 2 Sections per class (A, B)
- 5 Subjects (ENG, KAN, MAT, PHY, BIO)
- 600 Students (30 per section)
- 50 Teachers (5 per class, one per subject)
- 600 Parents (one per student)
- Sample attendance for last 3 days
- Sample marks for UT-1
- Diary entries, calendar events, circulars

### Step 4: Start the Application

```cmd
npm run dev:stack
```

### Step 5: Access the Portals

- **Main Portal**: http://localhost:3000
- **Onboarding**: http://localhost:3020
- **Students**: http://localhost:3030

---

## 🔐 Authentication & Login Credentials

### ✅ Auth System IS Implemented!

The project has a **working login system** at http://localhost:3000

### Login Credentials:

#### **Teacher Login:**
- **Role**: Select "Teacher"
- **Name**: Any teacher name from the database (e.g., "Aarav Sharma", "Ananya Patil")
- **Password**: `12345`

To get valid teacher names, after seeding run:
```cmd
docker exec -it school-mysql mysql -u sas_app -p9482824040 sas -e "SELECT name FROM teachers LIMIT 10;"
```

#### **Admin/HOD Login:**
- **Role**: Select "Admin / HOD"
- **Name**: Any name (e.g., "Admin", "HOD Name")
- **Password**: `12345`

#### **Student Login:**
- **Role**: Select "Student"
- **Phone**: Parent's phone number from database
- **Password**: (Set during seeding or use demo password)

To get valid phone numbers:
```cmd
docker exec -it school-mysql mysql -u sas_app -p9482824040 sas -e "SELECT usn, name, guardian_id FROM students LIMIT 5;"
```

#### **Parent Login:**
- **Role**: Select "Parent"
- **Phone**: Parent's phone number
- **Password**: (Set during seeding or use demo password)

### Google OAuth Login:

The system also supports **Google Sign-In**:
1. Select your role
2. Enter phone (for student/parent) or name (for teacher/admin)
3. Click "Continue with Google"
4. Authenticate with Google
5. You'll be redirected to your dashboard

### How It Works:

1. Go to http://localhost:3000
2. You'll see a beautiful login page with role selection
3. Choose your role (Student, Parent, Teacher, Admin)
4. Enter credentials
5. Click "Sign In"
6. You'll be redirected to your role-specific dashboard

---

## 📊 Demo Data Details

### After Seeding, You'll Have:

**Classes & Sections:**
```
CLASS 1 - Section A, B
CLASS 2 - Section A, B
...
CLASS 10 - Section A, B
```

**Subjects:**
- ENG (English)
- KAN (Kannada)
- MAT (Mathematics)
- PHY (Physics)
- BIO (Biology)

**Students:**
- 30 students per section
- Total: 600 students
- Names: Aarav Sharma, Ananya Patil, Rahul Reddy, etc.
- Each has a USN (roll number)
- Each has a parent/guardian

**Teachers:**
- 5 teachers per class (one per subject)
- Total: 50 teachers
- Each assigned to specific class-subject combinations

**Parents:**
- One parent per student
- Phone numbers generated
- Linked to their children

**Academic Data:**
- Attendance records for last 3 days (5 hours per day)
- UT-1 marks for all students (random scores)
- Diary entries for today
- Calendar events for current month
- Sample circulars

### Sample Student Data:

```
USN: CLASS1-A-001
Name: Aarav Sharma
Class: CLASS 1
Section: A
Parent: [Parent Name]
Attendance: 95% (last 3 days)
UT-1 Marks:
  - ENG: 85/100
  - KAN: 78/100
  - MAT: 92/100
```

---

## 🎯 Complete Setup Commands (Copy-Paste)

```cmd
# 1. Start databases
docker-compose up -d

# 2. Build shared library
npm run build -w @school-sas/shared-lib

# 3. Seed demo data (creates tables + 600 students)
node apps/frontend-next/scripts/seed-master.mjs
node apps/frontend-next/scripts/seed-dummy.mjs
node apps/frontend-next/scripts/seed-academics.mjs

# 4. Start application
npm run dev:stack

# 5. Open browser
# http://localhost:3000/teacher
# http://localhost:3000/student
# http://localhost:3000/parent
```

---

## 🛠 Docker Compose Commands

```cmd
# Start databases
docker-compose up -d

# Stop databases
docker-compose down

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Restart databases
docker-compose restart

# Stop and remove everything (including data)
docker-compose down -v
```

---

## 🎯 Complete Setup Commands (Copy-Paste)

```cmd
# 1. Build shared library
npm run build -w @school-sas/shared-lib

# 2. Seed MySQL database (creates tables + data)
node apps/frontend-next/scripts/seed-master.mjs
node apps/frontend-next/scripts/seed-dummy.mjs
node apps/frontend-next/scripts/seed-academics.mjs

# 3. Start everything
npm run dev:stack
```

---

## 📊 Database Architecture (Actual)

```
┌─────────────────────────────────────────────────┐
│              FRONTEND APPS                      │
│  - Main Portal (3000)                           │
│  - Onboarding Portal (3020)                     │
│  - Students Portal (3030)                       │
└─────────────────────────────────────────────────┘
         │                           │
         │ Uses MySQL                │ Calls APIs
         ↓                           ↓
┌──────────────────┐      ┌──────────────────────┐
│   MySQL (3306)   │      │  BACKEND SERVICES    │
│   Database: sas  │      │  - Study (3002)      │
│                  │      │  - Onboarding (3005) │
│  Tables:         │      └──────────────────────┘
│  • students      │                 │
│  • classes       │                 │ Uses MongoDB
│  • attendance    │                 ↓
│  • marks         │      ┌──────────────────────┐
│  • teachers      │      │  MongoDB (27017)     │
│  • parents       │      │  Database:           │
│  • etc.          │      │  school-sas          │
└──────────────────┘      └──────────────────────┘
```

**Why both?**
- Frontend directly queries MySQL for fast reads
- Backend services use MongoDB for flexibility
- This is a hybrid architecture

---

## 🔍 What Each Database Stores

### MySQL (Used by Frontend)
- **Classes, Sections, Subjects**
- **Students, Teachers, Parents**
- **Attendance records**
- **Marks and grades**
- **Diary entries**
- **Calendar events**
- **Circulars**
- **Study materials**

### MongoDB (Used by Backend Services)
- **Student records** (Study Service)
- **Class definitions** (Study Service)
- **Applications** (Onboarding Service)
- **Parent accounts** (Onboarding Service)

---

## 🚨 Common Issues & Fixes

### Issue 1: "Cannot find module shared-lib"

**Fix:**
```cmd
npm run build -w @school-sas/shared-lib
```

### Issue 2: MySQL Connection Failed

**Check if MySQL is running:**
```cmd
# Windows
net start MySQL80

# Or check services
services.msc
# Look for MySQL80 and start it
```

**Verify connection:**
```cmd
mysql -u sas_app -p9482824040 -h 127.0.0.1 sas
```

### Issue 3: MongoDB Connection Failed

**Check if MongoDB is running:**
```cmd
mongosh --eval "db.version()"
```

**Start MongoDB:**
```cmd
# Windows
net start MongoDB

# Or use Docker
docker start mongo
```

### Issue 4: Tables Don't Exist

**Run the seeding scripts:**
```cmd
node apps/frontend-next/scripts/seed-master.mjs
```

This creates all necessary tables.

---

## 📝 Environment Variables

The project uses these defaults (you can override in `.env`):

```env
# MySQL (Frontend)
DATABASE_URL=mysql://sas_app:9482824040@127.0.0.1:3306/sas
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=sas_app
DB_PASSWORD=9482824040
DB_NAME=sas

# MongoDB (Backend Services)
MONGODB_URI=mongodb://localhost:27017/school-sas

# RabbitMQ (Optional)
RABBITMQ_URL=amqp://localhost:5672

# Service URLs
STUDY_API_URL=http://localhost:3002
NEXT_PUBLIC_ONBOARDING_API_URL=http://localhost:3005
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Shared library built: `packages/shared-lib/dist/index.js` exists
- [ ] MySQL running: `mysql -u sas_app -p9482824040 sas` connects
- [ ] MongoDB running: `mongosh` connects
- [ ] Tables exist: `SHOW TABLES;` in MySQL shows tables
- [ ] Services start: No errors in terminal
- [ ] Frontend loads: http://localhost:3000 opens
- [ ] APIs respond: http://localhost:3002/healthz returns `{"status":"ok"}`

---

## 🎯 Quick Start (After First-Time Setup)

Once everything is set up, you only need:

```cmd
npm run dev:stack
```

The shared library stays built, and databases keep their data.

---

## 📚 What Gets Created

### After `seed-master.mjs`:
- 10 Classes (CLASS 1 to CLASS 10)
- 2 Sections per class (A, B)
- 5 Subjects (ENG, KAN, MAT, PHY, BIO)
- 5 Tests (UT-1, UT-2, UT-3, MID, FINAL)

### After `seed-dummy.mjs`:
- 600 Students (30 per section)
- 50 Teachers (5 per class)
- 600 Parents (one per student)
- Teaching assignments

### After `seed-academics.mjs`:
- Attendance for last 3 days
- Marks for UT-1
- Diary entries
- Calendar events
- Circulars

---

## 🔍 Accessing Demo Data

### View Students in MySQL:

```cmd
# Connect to MySQL
docker exec -it school-mysql mysql -u sas_app -p9482824040 sas

# Run queries
SELECT * FROM students LIMIT 10;
SELECT * FROM classes;
SELECT * FROM teachers;
SELECT COUNT(*) FROM students;
```

### View Data in MongoDB:

```cmd
# Connect to MongoDB
docker exec -it school-mongodb mongosh

# Switch to database
use school-sas

# View collections
show collections

# View students
db.students.find().limit(5)
db.classes.find()
```

---

## 🎓 Summary

**Setup Steps:**
1. ✅ `docker-compose up -d` - Start databases
2. ✅ `npm run build -w @school-sas/shared-lib` - Build shared library
3. ✅ Run seed scripts - Create 600 students + demo data
4. ✅ `npm run dev:stack` - Start application

**Access:**
- Teacher Portal: http://localhost:3000/teacher
- Student Portal: http://localhost:3000/student
- Parent Portal: http://localhost:3000/parent
- Admin Portal: http://localhost:3000/admin

**Auth:**
- No login required (demo mode)
- Just navigate to role-specific URLs
- Auth service planned but not implemented

**Demo Data:**
- 600 students across 10 classes
- 50 teachers
- Attendance, marks, diary, calendar
- All in MySQL database

---

## 🚨 Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:27017"

This means MongoDB isn't running. **Fix:**
```cmd
# Start MongoDB with docker-compose
docker-compose up -d mongodb

# Or start all databases
docker-compose up -d

# Verify it's running
docker-compose ps
```

The services will still work without MongoDB (they just log the error), but it's better to have it running.

### Databases won't start:
```cmd
# Check Docker is running
docker --version

# View logs
docker-compose logs mysql
docker-compose logs mongodb

# Restart databases
docker-compose restart
```

### Port already in use:
```cmd
# Stop existing containers
docker stop school-mysql school-mongodb

# Or change ports in docker-compose.yml
```

### Shared library error:
```cmd
# Rebuild it
npm run build -w @school-sas/shared-lib
```

### Seeding fails:
```cmd
# Make sure MySQL is running
docker-compose ps

# Check connection
docker exec -it school-mysql mysql -u sas_app -p9482824040 -e "SHOW DATABASES;"
```

### Can't login:
```cmd
# Make sure you seeded the database
node apps/frontend-next/scripts/seed-master.mjs
node apps/frontend-next/scripts/seed-dummy.mjs

# Get valid teacher names
docker exec -it school-mysql mysql -u sas_app -p9482824040 sas -e "SELECT name FROM teachers LIMIT 10;"

# Use password: 12345 for teachers and admin
```

---

**That's it!** You now have a complete school ERP with 600 students ready to use!

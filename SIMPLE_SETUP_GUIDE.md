# School ERP - Simple Setup Guide

## ❓ Your Questions Answered

### Q1: Do I need to run those service-specific commands?

**NO!** You only need ONE command:

```cmd
npm run dev:stack
```

This automatically runs ALL services for you:
- ✅ Study Service (backend)
- ✅ Onboarding Service (backend)
- ✅ Main Portal (frontend)
- ✅ Onboarding Portal (frontend)
- ✅ Students Portal (frontend)

**Those individual commands** like `npm run dev -w @school-sas/study-service` are only for debugging specific services. You don't need them!

---

### Q2: Can I use MySQL only as the database?

**Current Status**: The services are coded to use **MongoDB**, not MySQL.

**What you can do:**

#### Option A: Use MongoDB (Easiest - Works Now)
- ✅ No setup needed
- ✅ Database auto-created when you run `npm run dev:stack`
- ✅ Everything works out of the box

#### Option B: Use MySQL (Requires Code Changes)
- ❌ Services currently use MongoDB
- ❌ You'd need to modify service code to use MySQL
- ✅ MySQL schema is documented in `docs/mysql-database.md`
- ✅ Some frontend API routes support MySQL

**Recommendation**: Use MongoDB for now. It's what's working!

---

## 📝 Complete Setup Steps

### Step 1: Install MongoDB

**Windows:**
1. Download: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB runs as a service automatically

**Check if running:**
```cmd
mongosh --eval "db.version()"
```

**Or use Docker:**
```cmd
docker run -d -p 27017:27017 --name mongo mongo:latest
```

---

### Step 2: Install Project Dependencies

```cmd
cd school-sas-monorepo
npm install
```

This installs everything for all apps and services.

---

### Step 3: Start Everything

```cmd
npm run dev:stack
```

**What happens:**
- MongoDB database `school-sas` is auto-created
- Collections are auto-created when needed
- All services and frontends start

**You'll see output like:**
```
[dev] starting study-service: npm run dev -w @school-sas/study-service
[dev] starting onboarding-service: npm run dev -w @school-sas/onboarding-service
[dev] starting frontend-next: npm run dev -w frontend-next
[dev] starting onboarding-next: npm run dev -w onboarding-next
[dev] starting students-next: npm run dev -w students-next
```

---

### Step 4: Access the Portals

Open your browser:

| Portal | URL | Purpose |
|--------|-----|---------|
| **Main Portal** | http://localhost:3000 | Admin, Teacher, Student, Parent, Accountant, Principal |
| **Onboarding** | http://localhost:3020 | New student admissions |
| **Students** | http://localhost:3030 | Student-specific portal |

**Check services are running:**
- Study Service: http://localhost:3002/healthz
- Onboarding Service: http://localhost:3005/healthz

---

## 🎯 What About Demo Data?

### Current Situation:
- The `data/local-db.json` file is **empty**
- MongoDB collections are created **empty**
- You can add data through the UI or API

### If You Want Pre-Populated Data (MySQL Only):

**1. Install MySQL:**
```cmd
# Download from: https://dev.mysql.com/downloads/installer/
# Or use Docker:
docker run -d -p 3306:3306 --name mysql ^
  -e MYSQL_ROOT_PASSWORD=root ^
  -e MYSQL_DATABASE=sas ^
  -e MYSQL_USER=sas_app ^
  -e MYSQL_PASSWORD=sas_strong_password_123 ^
  mysql:8
```

**2. Create Database:**
```sql
CREATE DATABASE IF NOT EXISTS sas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sas_app'@'%' IDENTIFIED BY 'sas_strong_password_123';
GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'%';
FLUSH PRIVILEGES;
```

**3. Apply Schema:**
See `docs/mysql-database.md` for the complete SQL schema.

**4. Seed Demo Data:**
```cmd
# Seed master data (classes, sections, subjects)
node apps/frontend-next/scripts/seed-master.mjs

# Seed 600 dummy students, parents, teachers
node apps/frontend-next/scripts/seed-dummy.mjs

# Seed attendance, marks, diaries, calendar
node apps/frontend-next/scripts/seed-academics.mjs

# Or all at once:
npm run db:seed
```

**What you get:**
- 10 Classes (CLASS 1 to CLASS 10)
- 2 Sections per class (A, B)
- 5 Subjects (ENG, KAN, MAT, PHY, BIO)
- 600 Students (30 per section)
- 50 Teachers (5 per class)
- Sample attendance, marks, diaries, calendar events

**Note**: This only works with MySQL, not MongoDB!

---

## 🔍 Understanding the Services

### What are "Services"?

Services are **backend APIs** that handle specific tasks:

```
┌─────────────────────────────────────────────────┐
│                  Browser                        │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         Frontend Apps (Next.js)                 │
│  - Main Portal (3000)                           │
│  - Onboarding Portal (3020)                     │
│  - Students Portal (3030)                       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         Backend Services (Express)              │
│  - Study Service (3002) → MongoDB               │
│  - Onboarding Service (3005) → MongoDB          │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              Database                           │
│  - MongoDB (school-sas)                         │
│  - MySQL (sas) - optional                       │
└─────────────────────────────────────────────────┘
```

### Study Service (Port 3002)
**Handles:**
- Classes and sections
- Student records
- Attendance
- Marks and grades
- Assignments
- Diary entries
- Calendar events

**Example API:**
- `POST http://localhost:3002/v1/classes` - Create class
- `GET http://localhost:3002/v1/students` - List students
- `POST http://localhost:3002/v1/students` - Add student

### Onboarding Service (Port 3005)
**Handles:**
- Parent signup/login
- Student applications
- Document uploads
- Admissions workflow
- Application approval

**Example API:**
- `POST http://localhost:3005/v1/onboarding/public/signup` - Parent signup
- `POST http://localhost:3005/v1/onboarding/applications` - Submit application

---

## 🛠 Troubleshooting

### MongoDB Connection Failed
```cmd
# Check if MongoDB is running
mongosh --eval "db.version()"

# If not running, start it:
# Windows: MongoDB should auto-start as a service
# Or restart: net start MongoDB

# Docker:
docker start mongo
```

### Port Already in Use
```cmd
# Find what's using the port
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### Services Not Starting
1. Make sure MongoDB is running
2. Check if ports 3000, 3002, 3005, 3020, 3030 are free
3. Look at the terminal output for errors

### Can't Access Portals
1. Wait 30-60 seconds after running `npm run dev:stack`
2. Check terminal for "ready" messages
3. Try http://localhost:3000/healthz

---

## 📊 Summary

### What You Need to Know:

1. **One Command to Rule Them All:**
   ```cmd
   npm run dev:stack
   ```

2. **Database:**
   - MongoDB is used (auto-created)
   - MySQL is optional (requires setup)

3. **No Manual Service Commands:**
   - `npm run dev:stack` runs all services automatically
   - Individual commands are only for debugging

4. **Access Everything:**
   - Main Portal: http://localhost:3000
   - Onboarding: http://localhost:3020
   - Students: http://localhost:3030

5. **Demo Data:**
   - MongoDB starts empty (add via UI)
   - MySQL can be pre-populated with 600 students

---

## 🎓 Next Steps

1. **Explore the Main Portal** (http://localhost:3000)
   - Try different role pages: `/admin`, `/teacher`, `/student`, `/parent`

2. **Check the API**
   - Study Service: http://localhost:3002/healthz
   - Onboarding Service: http://localhost:3005/healthz

3. **Read the Full Guide**
   - See `PROJECT_GUIDE.md` for complete documentation

4. **Understand the Architecture**
   - See `docs/ARCHITECTURE.md` for system design

---

**Need Help?** Check the full `PROJECT_GUIDE.md` for detailed information!

# School SAS (Student Administration System) - Complete Project Guide

## � Qubick Start (TL;DR)

```cmd
# 1. Install dependencies
npm install

# 2. Start everything (MongoDB will auto-create database)
npm run dev:stack

# 3. Access the portals:
# Main Portal: http://localhost:3000
# Onboarding: http://localhost:3020
# Students: http://localhost:3030
```

**That's it!** MongoDB database and collections are created automatically. No manual database setup needed!

---

## 📋 Table of Contents
1. [Quick Start](#quick-start-tldr)
2. [Project Overview](#project-overview)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Prerequisites](#prerequisites)
7. [Installation & Setup](#installation--setup)
8. [Running the Application](#running-the-application)
9. [Accessing Different Portals](#accessing-different-portals)
10. [Database Setup](#database-setup)
11. [Available Scripts](#available-scripts)
12. [Key Features](#key-features)
13. [Development Workflow](#development-workflow)

---

## 🎯 Project Overview

**School SAS** is a comprehensive School Management ERP (Enterprise Resource Planning) system built as a **monorepo** containing multiple microservices and frontend applications. It manages:

- Student admissions and onboarding
- Academic content (classes, attendance, marks, assignments)
- Payment processing and fee management
- Notifications (Email, SMS, WhatsApp)
- Multiple user portals (Admin, Teacher, Student, Parent, Accountant, Principal)

**Business Goal**: Provide a modular, fault-tolerant system with ≥99.5% uptime for managing all aspects of school operations.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: CSS with Framer Motion for animations
- **Ports**:
  - Main School Portal: `3000`
  - Onboarding Portal: `3020`
  - Students Portal: `3030`
  - Admissions Form: `3010` (optional)

### Backend Services
- **Framework**: Express.js (Node.js)
- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Ports**:
  - Study Service: `3002`
  - Onboarding Service: `3005`
  - Auth Service: (planned)
  - Notification Service: (planned)
  - Payment Service: (planned)
  - Reporting Service: (planned)

### Databases
- **Primary**: MongoDB (for microservices data)
  - Default: `mongodb://localhost:27017/school-sas`
- **Secondary**: MySQL (for unified ERP data)
  - Database: `sas`
  - User: `sas_app`
  - Password: `sas_strong_password_123`

### Message Queue
- **RabbitMQ**: For asynchronous event-driven communication
  - Default: `amqp://localhost:5672`

### External Integrations (Planned)
- **Payments**: Razorpay / Stripe
- **Notifications**: Twilio (WhatsApp), SendGrid/SMTP (Email)
- **Storage**: AWS S3 (for files, receipts, media)

### Package Management
- **npm workspaces** (monorepo structure)
- Alternative: pnpm (workspace config included)

---

## 🏗 Architecture

### Architecture Style
**Modular Microservices** with:
- API Gateway (planned)
- Event-driven messaging (RabbitMQ)
- Service-owned databases (MongoDB per service)
- Shared library for common utilities

### Service Boundaries

#### 1. **Auth Service** (Planned)
- User authentication (JWT/OAuth)
- Role-based access control (RBAC)
- Session management
- Password resets

#### 2. **Study Service** (Active - Port 3002)
- Classes, sections, enrollments
- Timetables and attendance
- Assignments and submissions
- Marks/grades management
- Notes, circulars, diaries
- **Database**: MongoDB collection `students`, `classes`

#### 3. **Onboarding Service** (Active - Port 3005)
- Parent signup and login
- Student application forms
- Admissions workflow
- Staff review and approval
- **Database**: MongoDB collection `applications`, `parents`

#### 4. **Notification Service** (Planned)
- Email, SMS, WhatsApp delivery
- Template management
- Event-driven notifications
- Delivery tracking

#### 5. **Payment Service** (Planned)
- Fee catalog and invoices
- Payment gateway integration
- Receipt generation
- Reconciliation

#### 6. **Reporting Service** (Planned)
- Analytics dashboards
- Class-wise reports
- Teacher performance metrics

### Data Flow Example
```
Parent → Onboarding Portal (3020) → Onboarding Service (3005) → MongoDB
Teacher → Main Portal (3000) → Study Service (3002) → MongoDB
Admin → Main Portal (3000) → MySQL (direct) + Study Service
```

---

## 📁 Project Structure

```
school-sas-monorepo/
├── apps/                          # Frontend applications
│   ├── frontend-next/             # Main school portal (Admin, Teacher, Student, Parent)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── admin/         # Admin dashboard
│   │   │   │   ├── teacher/       # Teacher portal
│   │   │   │   ├── student/       # Student portal
│   │   │   │   ├── parent/        # Parent portal
│   │   │   │   ├── accountant/    # Accountant portal
│   │   │   │   ├── principal/     # Principal portal
│   │   │   │   └── api/           # Backend-for-Frontend API routes
│   │   │   ├── components/        # Shared React components
│   │   │   └── lib/               # Utilities
│   │   ├── scripts/               # Database seeding scripts
│   │   └── package.json
│   ├── onboarding-next/           # Separate onboarding website (Port 3020)
│   ├── students-next/             # Student-specific portal (Port 3030)
│   └── admissions-form-next/      # Admissions demo (Port 3010, optional)
│
├── services/                      # Backend microservices
│   ├── auth-service/              # Authentication & authorization
│   ├── study-service/             # Academic operations (Port 3002)
│   ├── onboarding-service/        # Admissions workflow (Port 3005)
│   ├── notification-service/      # Multi-channel notifications
│   ├── payment-service/           # Fee and payment processing
│   ├── reporting-service/         # Analytics and reports
│   └── _template/                 # Service template for new services
│
├── packages/                      # Shared libraries
│   └── shared-lib/                # Common utilities, DB connectors, logger
│
├── infra/                         # Infrastructure as Code
│   ├── mysql/                     # MySQL setup and migrations
│   └── README.md                  # Terraform/K8s placeholders
│
├── scripts/                       # Utility scripts
│   ├── dev-all.mjs                # Start all services at once
│   ├── fresh-install.cmd          # Clean install (Windows)
│   ├── setup-and-seed.cmd         # Database setup and seeding
│   └── mysql-*.sql                # MySQL management scripts
│
├── docs/                          # Documentation
│   ├── ARCHITECTURE.md            # Detailed architecture
│   ├── mysql-database.md          # MySQL schema and setup
│   ├── onboarding-implementation-plan.md
│   └── adrs/                      # Architecture Decision Records
│
├── epics/                         # Product epics and features
│   ├── student-onboarding-epic.md
│   ├── payment-epic.md
│   ├── notification-epic.md
│   ├── education-content-epic.md
│   └── ai-integration-epic.md
│
├── data/                          # Local data storage
│   └── local-db.json              # Demo data (legacy)
│
├── package.json                   # Root package.json (workspace config)
├── pnpm-workspace.yaml            # pnpm workspace config
├── tsconfig.base.json             # Shared TypeScript config
└── README.md                      # Quick start guide
```

---

## ✅ Prerequisites

Before running this project, ensure you have:

1. **Node.js 18+** installed
   - Check: `node --version`
   - Download: https://nodejs.org/

2. **npm** (comes with Node.js)
   - Check: `npm --version`

3. **MongoDB** (optional but recommended)
   - Install: https://www.mongodb.com/try/download/community
   - Or use Docker: `docker run -d -p 27017:27017 --name mongo mongo:latest`
   - Default connection: `mongodb://localhost:27017/school-sas`

4. **MySQL** (optional, for unified ERP features)
   - Install: https://dev.mysql.com/downloads/installer/
   - Or use Docker: `docker run -d -p 3306:3306 --name mysql -e MYSQL_ROOT_PASSWORD=root mysql:8`

5. **RabbitMQ** (optional, for messaging)
   - Install: https://www.rabbitmq.com/download.html
   - Or use Docker: `docker run -d -p 5672:5672 -p 15672:15672 --name rabbitmq rabbitmq:3-management`

6. **Git** (to clone the repository)

---

## 🚀 Installation & Setup

### Step 1: Install Dependencies

```cmd
# Navigate to project root
cd school-sas-monorepo

# Install all dependencies (root + all workspaces)
npm install
```

This will install dependencies for:
- Root workspace
- All apps (frontend-next, onboarding-next, students-next, admissions-form-next)
- All services (auth-service, study-service, onboarding-service, etc.)
- Shared packages (shared-lib)

### Step 2: Setup MongoDB with Demo Data

#### Option A: MongoDB Only (Recommended for Quick Start)

**1. Install and Start MongoDB:**

```cmd
# Windows (if using MongoDB installer)
# MongoDB should start automatically as a service

# Or check if it's running
mongosh --eval "db.version()"

# If not installed, download from: https://www.mongodb.com/try/download/community
```

**2. MongoDB will auto-create the database when services start!**

The database `school-sas` and collections are created automatically when you run the services. No manual setup needed!

**3. The demo data in `data/local-db.json` is currently empty**, but you can add data through the UI or API calls.

#### Option B: MySQL with Full Demo Data (Advanced)

If you want to use MySQL with pre-populated demo data:

**1. Install and Start MySQL:**

```cmd
# Windows: Download MySQL installer from https://dev.mysql.com/downloads/installer/
# During installation, set root password

# Or use Docker:
docker run -d -p 3306:3306 --name mysql ^
  -e MYSQL_ROOT_PASSWORD=root ^
  -e MYSQL_DATABASE=sas ^
  -e MYSQL_USER=sas_app ^
  -e MYSQL_PASSWORD=sas_strong_password_123 ^
  mysql:8
```

**2. Create Database and User (if not using Docker):**

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Run these commands:
CREATE DATABASE IF NOT EXISTS sas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sas_app'@'%' IDENTIFIED BY 'sas_strong_password_123';
GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'%';
FLUSH PRIVILEGES;
EXIT;
```

**3. Apply MySQL Schema:**

See `docs/mysql-database.md` for the complete schema, or run the schema creation scripts if available.

**4. Seed Demo Data:**

```cmd
# Seed master data (classes, sections, subjects, tests)
node apps/frontend-next/scripts/seed-master.mjs

# Seed dummy students, parents, teachers (600 students across 10 classes)
node apps/frontend-next/scripts/seed-dummy.mjs

# Seed academic data (attendance, marks, diaries, calendar, circulars)
node apps/frontend-next/scripts/seed-academics.mjs

# Or run all at once:
npm run db:seed
```

**What gets seeded:**
- 10 Classes (CLASS 1 to CLASS 10)
- 2 Sections per class (A, B)
- 5 Subjects (ENG, KAN, MAT, PHY, BIO)
- 5 Tests (UT-1, UT-2, UT-3, MID, FINAL)
- 30 Students per section (600 total students)
- 5 Teachers per class (one per subject)
- Parents for each student
- Sample attendance for last 3 days
- Sample marks for UT-1
- Sample diary entries
- Calendar events
- Circulars

### Step 3: Environment Variables (Optional)

The project uses sensible defaults, but you can customize:

Create a `.env` file in the root (optional):

```env
# MongoDB (default - no setup needed)
MONGODB_URI=mongodb://localhost:27017/school-sas

# RabbitMQ (optional - for messaging)
RABBITMQ_URL=amqp://localhost:5672

# Service URLs (defaults work fine)
STUDY_API_URL=http://localhost:3002
NEXT_PUBLIC_ONBOARDING_API_URL=http://localhost:3005

# MySQL (only if using MySQL)
DATABASE_URL=mysql://sas_app:sas_strong_password_123@localhost:3306/sas
```

**Note**: If you don't create a `.env` file, the defaults will work fine!

---

## 🎮 Running the Application

### ⭐ RECOMMENDED: Run Everything at Once

```cmd
npm run dev:stack
```

**This ONE command starts everything:**
- ✅ **Study Service** (backend API on port `3002`)
- ✅ **Onboarding Service** (backend API on port `3005`)
- ✅ **Main Portal** (frontend on port `3000`)
- ✅ **Onboarding Portal** (frontend on port `3020`)
- ✅ **Students Portal** (frontend on port `3030`)

**You can immediately access all portals!**

**With Admissions Demo:**
```cmd
set WITH_ADMISSIONS=1
npm run dev:stack
```

### When to Run Individual Components?

**You DON'T need to run these separately!** They're only for debugging or testing specific parts:

#### Run Main Portal Only
```cmd
npm run dev
# or
npm run dev -w frontend-next
```
Access at: http://localhost:3000

#### Run Onboarding Portal Only
```cmd
npm run dev:onboarding
```
Access at: http://localhost:3020

#### Run Students Portal Only
```cmd
npm run dev:students
```
Access at: http://localhost:3030

#### Run Study Service Only (Backend)
```cmd
npm run dev -w @school-sas/study-service
```
API available at: http://localhost:3002

#### Run Onboarding Service Only (Backend)
```cmd
npm run dev:onboarding-service
```
API available at: http://localhost:3005

**Note**: The individual service commands (`npm run dev -w @school-sas/study-service`) are automatically executed by `npm run dev:stack`, so you don't need to run them manually!

---

## 🌐 Accessing Different Portals

### Main School Portal (Port 3000)
**URL**: http://localhost:3000

**Available Roles**:
- **Admin** - `/admin/*`
  - Dashboard, user management, system settings
  - Class and section management
  - Reports and analytics

- **Teacher** - `/teacher/*`
  - Attendance marking
  - Marks entry (UT-1, UT-2, Mid-term, Final)
  - Diary entries
  - Calendar management
  - Circulars
  - Materials upload (textbooks, PYQs)

- **Student** - `/student/*`
  - View attendance
  - View marks and grades
  - Access study materials
  - View diary and calendar
  - Submit assignments

- **Parent** - `/parent/*`
  - View child's attendance
  - View child's marks
  - Access circulars and notifications
  - Fee payment status

- **Accountant** - `/accountant/*`
  - Fee management
  - Payment reconciliation
  - Invoice generation
  - Financial reports

- **Principal** - `/principal/*`
  - Approvals and oversight
  - School-wide analytics
  - Policy management

### Onboarding Portal (Port 3020)
**URL**: http://localhost:3020

**Purpose**: Separate website for new student admissions

**Features**:
- Parent signup and login
- Student application form
- Document upload
- Application status tracking

**Staff Access**:
- Admissions officer review
- Principal approval
- Fee assignment

### Students Portal (Port 3030)
**URL**: http://localhost:3030

**Purpose**: Dedicated student-facing portal

**Features**:
- Simplified student dashboard
- Quick access to assignments
- Grade viewing
- Study materials

---

## 🗄 Database Setup

### MongoDB Collections

The project uses MongoDB with the following collections:

**Study Service Database** (`school-sas`):
- `students` - Student records
- `classes` - Class definitions (e.g., "Class 8", "Class 10")
- `sections` - Section assignments (e.g., "A", "B")
- `attendance` - Attendance records
- `assignments` - Homework and assignments
- `grades` - Marks and grades
- `diaries` - Daily diary entries
- `circulars` - School announcements

**Onboarding Service Database** (`school-sas`):
- `applications` - Student applications
- `parents` - Parent/guardian information
- `files` - Uploaded documents

### MySQL Tables (Optional)

For unified ERP features, MySQL provides:
- `auth_users`, `auth_roles`, `auth_role_bindings` - Authentication
- `classes`, `sections`, `students`, `parents`, `teachers` - Core entities
- `subjects`, `class_subjects`, `teaching_assignments` - Academic structure
- `attendance`, `attendance_entries` - Attendance tracking
- `tests`, `mark_sheets`, `mark_entries` - Marks management
- `diaries`, `calendar_events`, `circulars` - Academic content
- `materials`, `textbooks`, `pyqs` - Study resources
- `fees_catalog`, `invoices`, `payments` - Financial management

**See `docs/mysql-database.md` for complete schema**

---

## 📜 Available Scripts

### Root Level Scripts

```cmd
# Development
npm run dev                    # Run main portal only
npm run dev:stack              # Run all services and apps
npm run dev:onboarding         # Run onboarding portal
npm run dev:students           # Run students portal
npm run dev:admissions         # Run admissions form

# Build
npm run build                  # Build main portal
npm run build:onboarding       # Build onboarding portal
npm run build:students         # Build students portal

# Production
npm run start                  # Start main portal (production)
npm run start:onboarding       # Start onboarding portal (production)
npm run start:students         # Start students portal (production)

# Database
npm run db:apply               # Apply MySQL schema
npm run db:seed                # Seed database with demo data
npm run db:all                 # Setup and seed everything

# Utilities
npm run lint                   # Run linters
npm run test                   # Run tests
```

### Service-Specific Scripts

```cmd
# Study Service
npm run dev -w @school-sas/study-service
npm run build -w @school-sas/study-service
npm run start -w @school-sas/study-service

# Onboarding Service
npm run dev -w @school-sas/onboarding-service
npm run build -w @school-sas/onboarding-service
npm run start -w @school-sas/onboarding-service
```

### Utility Scripts (in `scripts/` folder)

```cmd
# Windows
scripts\fresh-install.cmd      # Clean install all dependencies
scripts\full-clean.cmd         # Remove all node_modules and caches
scripts\reset-and-seed.cmd     # Reset and seed database
scripts\setup-and-seed.cmd     # Initial setup and seed

# PowerShell
scripts\fresh-install.ps1
scripts\full-clean.ps1

# MySQL Management
# Run these in MySQL client
scripts\mysql-reset.sql        # Reset database
scripts\mysql-nuke.sql         # Drop all tables
scripts\mysql-fix-sas-user.sql # Fix user permissions
```

---

## 🎯 Key Features

### 1. Student Onboarding
- **Epic**: `epics/student-onboarding-epic.md`
- Parent registration and login
- Online application form
- Document upload
- Multi-step approval workflow
- Auto-assignment to classes

### 2. Academic Management
- **Epic**: `epics/education-content-epic.md`
- Class and section management
- Attendance tracking (per hour/subject)
- Marks entry (UT-1, UT-2, Mid-term, Final)
- Diary entries with attachments
- Calendar events
- Circulars and announcements
- Study materials (textbooks, PYQs, notes)
- Syllabus management

### 3. Payment Processing
- **Epic**: `epics/payment-epic.md`
- Fee structure definition
- Invoice generation
- Payment gateway integration (Razorpay/Stripe)
- Receipt generation
- Partial payments and installments
- Reconciliation and reports

### 4. Notifications
- **Epic**: `epics/notification-epic.md`
- Multi-channel (Email, SMS, WhatsApp)
- Template management
- Event-driven triggers
- User preferences
- Delivery tracking

### 5. AI Integration (Planned)
- **Epic**: `epics/ai-integration-epic.md`
- Content recommendations
- Tutor assistant
- Grading assistance
- Predictive analytics

---

## 🔧 Development Workflow

### Adding a New Service

1. Copy the template:
```cmd
cp -r services/_template services/my-new-service
```

2. Update `package.json` in the new service
3. Add to root `package.json` scripts
4. Implement your service logic in `src/index.ts`

### Adding a New Frontend App

1. Create new Next.js app in `apps/`:
```cmd
cd apps
npx create-next-app@latest my-new-app --typescript
```

2. Update port in `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 3040"
  }
}
```

3. Add to `scripts/dev-all.mjs`

### Database Migrations

#### MongoDB
- Collections are created automatically
- Use migration scripts in service code if needed

#### MySQL
- Schema changes in `docs/mysql-database.md`
- Apply with SQL scripts or migration tools
- Seed data with scripts in `apps/frontend-next/scripts/`

### Testing

```cmd
# Run all tests
npm test

# Test specific service
npm test -w @school-sas/study-service
```

### Building for Production

```cmd
# Build all
npm run build

# Build specific app
npm run build -w frontend-next

# Build specific service
npm run build -w @school-sas/study-service
```

### Deployment

The project is designed for containerized deployment:

1. **Docker**: Each service/app can be containerized
2. **Kubernetes**: Helm charts planned in `infra/k8s/`
3. **AWS**: Terraform configs planned in `infra/terraform/`

**Planned Infrastructure**:
- EKS (Kubernetes)
- Amazon MQ (RabbitMQ)
- DocumentDB (MongoDB-compatible)
- RDS MySQL
- S3 (file storage)
- CloudFront (CDN)

---

## 🐛 Troubleshooting

### Port Already in Use
```cmd
# Windows: Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod --version`
- Check connection string in environment variables
- Default: `mongodb://localhost:27017/school-sas`

### MySQL Connection Failed
- Ensure MySQL is running
- Verify credentials: `sas_app` / `sas_strong_password_123`
- Check database exists: `SHOW DATABASES;`

### Dependencies Not Installing
```cmd
# Clean install
npm run fresh-install

# Or manually
rm -rf node_modules package-lock.json
npm install
```

### Service Not Starting
- Check if port is available
- Verify environment variables
- Check logs for specific errors
- Ensure dependencies (MongoDB/RabbitMQ) are running

---

## 📚 Additional Resources

### Documentation
- **Architecture**: `docs/ARCHITECTURE.md`
- **MySQL Setup**: `docs/mysql-database.md`
- **Onboarding Plan**: `docs/onboarding-implementation-plan.md`
- **Product Epics**: `PRODUCT_EPICS.md`

### API Documentation
- Study Service: http://localhost:3002/healthz
- Onboarding Service: http://localhost:3005/healthz

### Key Endpoints

**Study Service (3002)**:
- `POST /v1/classes` - Create class
- `GET /v1/classes` - List classes
- `POST /v1/students` - Create student
- `GET /v1/students` - List students
- `DELETE /v1/admin/wipe` - Wipe data (demo only)

**Onboarding Service (3005)**:
- `POST /v1/onboarding/public/signup` - Parent signup
- `POST /v1/onboarding/public/login` - Parent login
- `POST /v1/onboarding/applications` - Submit application
- `GET /v1/onboarding/applications` - List applications

---

## 🤝 Contributing

This is a private school ERP project. For questions or contributions:

1. Review the architecture docs
2. Follow the existing code structure
3. Write tests for new features
4. Update documentation

---

## 📝 Notes

- **Current Status**: Active development, MVP features implemented
- **Production Ready**: No (demo/development stage)
- **Database**: MongoDB primary, MySQL optional
- **Authentication**: Demo mode (production auth planned)
- **Payments**: Integration planned (Razorpay/Stripe)

---

## 🎓 Quick Start Summary

```cmd
# 1. Install dependencies
npm install

# 2. Start MongoDB (if not running)
# mongod

# 3. Run everything with ONE command
npm run dev:stack

# 4. Access portals
# Main Portal: http://localhost:3000
# Onboarding: http://localhost:3020
# Students: http://localhost:3030
```

---

## ❓ Frequently Asked Questions

### Q: Do I need to run those service-specific commands?

**A: NO!** You only need `npm run dev:stack`. 

The commands like `npm run dev -w @school-sas/study-service` are automatically executed by `npm run dev:stack`. You only need them if you want to debug a specific service separately.

### Q: Can I use MySQL only as the database?

**A: Not currently.** The services are coded to use MongoDB. MySQL support is documented but not fully integrated in the running services. 

**Recommendation**: Use MongoDB (it auto-creates everything). If you need MySQL features, you'll need to modify the service code.

### Q: What are those services about?

**A: Services are backend APIs:**
- **Study Service** (3002): Handles classes, students, attendance, marks, assignments
- **Onboarding Service** (3005): Handles parent signup, applications, admissions

They're like specialized workers that the frontend apps talk to.

### Q: How do I add demo data?

**A: For MongoDB**: Data is added through the UI or API calls (starts empty)

**For MySQL**: Run the seeding scripts:
```cmd
npm run db:seed
```

See `SIMPLE_SETUP_GUIDE.md` for detailed instructions.

---

## 📚 Additional Documentation

- **Simple Setup Guide**: `SIMPLE_SETUP_GUIDE.md` - Answers common questions
- **Architecture Diagram**: `ARCHITECTURE_SIMPLE.md` - Visual explanation
- **Detailed Architecture**: `docs/ARCHITECTURE.md` - Technical deep dive
- **MySQL Setup**: `docs/mysql-database.md` - Database schema
- **Product Features**: `PRODUCT_EPICS.md` - Feature roadmap

---

**Last Updated**: November 2025
**Version**: 0.1.0
**Maintainer**: School SAS Team

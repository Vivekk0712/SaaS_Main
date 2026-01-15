# Environment Files Explained

## Overview

Your project has **TWO separate environment configurations**:

### 1. Root `.env` - Backend Services
**Location:** `C:\Users\Dell\SAS-main\.env`  
**Purpose:** Configuration for backend services and plugins  
**Used by:** Node.js services, Python plugins, dev stack

### 2. Frontend `.env.local` - Next.js Frontend
**Location:** `C:\Users\Dell\SAS-main\apps\frontend-next\.env.local`  
**Purpose:** Configuration for Next.js frontend application  
**Used by:** React components, API routes, client-side code

---

## Root `.env` (Backend)

### What It Contains:
```env
# Database (shared by all services)
DATABASE_URL=mysql://sas_app:9482824040@127.0.0.1:3306/sas
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=sas_app
DB_PASSWORD=9482824040
DB_NAME=sas

# MongoDB
MONGODB_URI=mongodb://localhost:27017/school-sas

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Service URLs (for inter-service communication)
STUDY_API_URL=http://localhost:3002
NEXT_PUBLIC_ONBOARDING_API_URL=http://localhost:3005
WHATSAPP_PLUGIN_URL=http://localhost:4100
RAZORPAY_PLUGIN_URL=http://localhost:5002
RAG_PLUGIN_URL=http://localhost:4000
MCP_SERVER_URL=http://localhost:5003  # NEW!

# Razorpay (backend keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
```

### Used By:
- ✅ `scripts/dev-all.mjs` - Dev stack
- ✅ Backend services (study-service, onboarding-service)
- ✅ Python plugins (MCP, RAG chatbot)
- ✅ TypeScript plugins (Razorpay, WhatsApp)

---

## Frontend `.env.local` (Next.js)

### What It Contains:
```env
# Database (for Next.js API routes)
DATABASE_URL=mysql://sas_app:9482824040@127.0.0.1:3306/sas
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=sas_app
DB_PASSWORD=9482824040
DB_NAME=sas

# Service URLs (for API calls from frontend)
STUDY_API_URL=http://localhost:3002
NEXT_PUBLIC_ONBOARDING_API_URL=http://localhost:3005
RAG_PLUGIN_URL=http://localhost:4000
RAZORPAY_PLUGIN_URL=http://localhost:5002
MCP_SERVER_URL=http://localhost:5003  # Should be added!

# Razorpay (frontend needs both)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

# OAuth (Google login)
OAUTH_CLIENT_ID=xxx
OAUTH_CLIENT_SECRET=xxx
OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/oauth/callback

# Twilio (SMS)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx

# Backblaze B2 (file storage)
B2_KEY_ID=xxx
B2_APPLICATION_KEY=xxx
B2_BUCKET_NAME=erp-rag-dev
```

### Used By:
- ✅ Next.js frontend (apps/frontend-next)
- ✅ API routes in Next.js
- ✅ React components (only `NEXT_PUBLIC_*` variables)

---

## Key Differences

| Aspect | Root `.env` | Frontend `.env.local` |
|--------|-------------|----------------------|
| **Scope** | All backend services | Next.js frontend only |
| **Access** | Server-side only | Server + Client (NEXT_PUBLIC_*) |
| **Services** | Study, Onboarding, Plugins | Frontend app, API routes |
| **Location** | Project root | apps/frontend-next/ |
| **Priority** | Lower | Higher (overrides .env) |

---

## Important Rules

### 1. Client-Side Variables
Only variables prefixed with `NEXT_PUBLIC_` are accessible in browser:
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=xxx  # ✅ Available in React components
RAZORPAY_KEY_SECRET=xxx           # ❌ Server-side only (secure)
```

### 2. Duplication is OK
Some variables appear in both files because:
- Backend services need them
- Frontend API routes need them
- This is normal and expected!

### 3. Priority Order (Next.js)
1. `.env.local` (highest priority)
2. `.env.development` / `.env.production`
3. `.env`

---

## What Needs to Be Added

### Frontend `.env.local` is Missing:
```env
# MCP Server Plugin (Database Chat)
MCP_SERVER_URL=http://localhost:5003
```

This is needed for the `/api/database-chat` route to work!

---

## When to Edit Which File

### Edit Root `.env` when:
- Adding new backend service
- Changing database credentials for all services
- Updating plugin URLs
- Configuring dev stack

### Edit Frontend `.env.local` when:
- Adding frontend-specific config
- Updating OAuth credentials
- Changing Twilio/Backblaze settings
- Adding URLs for API routes to call

---

## Example: MCP Server Integration

### Root `.env` (Already Added ✅):
```env
MCP_SERVER_URL=http://localhost:5003
```

### Frontend `.env.local` (Needs to be Added):
```env
MCP_SERVER_URL=http://localhost:5003
```

Both need it because:
- Root: Dev stack needs to know about MCP server
- Frontend: API route `/api/database-chat` needs to call MCP server

---

## Summary

- ✅ **Two separate files** with different purposes
- ✅ **Some duplication is normal** (both need service URLs)
- ✅ **Root `.env`** = Backend services
- ✅ **Frontend `.env.local`** = Next.js app
- ✅ **Both are needed** for the system to work

Think of it like this:
- Root `.env` = "Where are the services?"
- Frontend `.env.local` = "How do I connect to them?"

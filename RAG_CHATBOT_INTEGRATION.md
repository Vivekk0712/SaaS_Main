# 🤖 RAG Chatbot Integration Guide

## Overview

The RAG (Retrieval-Augmented Generation) Chatbot has been integrated into the student portal, allowing students to upload PDF study materials and ask questions using AI.

---

## ✅ What Was Integrated

### 1. Database Tables
- `rag_documents` - Tracks uploaded PDFs per student
- `rag_conversations` - Stores chat sessions
- `rag_messages` - Stores chat history

### 2. API Routes
- `/api/chatbot/upload` - Upload PDF files
- `/api/chatbot/query` - Ask questions
- `/api/chatbot/documents` - List/delete documents

### 3. Student UI
- New page: `/student/ai-tutor`
- Upload PDFs
- Chat interface
- Document management
- Clear chat history

### 4. Dev Script
- RAG plugin now starts automatically with `npm run dev:stack`

---

## 🚀 Setup Instructions

### 1. Install RAG Plugin Dependencies

```bash
cd rag_chatbot_plugin
npm install
pip install -r requirements.txt
```

### 2. Start Required Services

The RAG plugin needs these services running:

**Using Docker (Recommended)**
```bash
cd rag_chatbot_plugin
docker-compose up -d
```

This starts:
- Qdrant (vector database) on port 6333
- Redis (optional caching) on port 6379

**Note**: MySQL is NOT in Docker - the RAG plugin uses your existing local MySQL database (`sas` database on port 3306)

### 3. Configure RAG Plugin

Edit `rag_chatbot_plugin/.env`:

```env
# Server
PORT=4000

# Gemini API Key (REQUIRED)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Qdrant
QDRANT_URL=http://localhost:6333

# Database (uses main SAS database - same as ERP)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=sas_app
DB_PASSWORD=9482824040
DB_NAME=sas  # Same database as main ERP!
```

**Get Gemini API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add it to the `.env` file

### 4. Add RAG Tables to Database

```bash
mysql -u sas_app -p9482824040 sas < rag-chatbot-tables.sql
```

### 5. Start Embedding Server

In a separate terminal:
```bash
cd rag_chatbot_plugin
python embedding_server.py
```

Keep this running (port 8000).

### 6. Start All Services

```bash
# From project root
npm run dev:stack
```

This now starts:
- Main app (port 3000)
- Study service (port 3002)
- Onboarding service (port 3005)
- Razorpay plugin (port 5002)
- **RAG Chatbot plugin (port 4000)** ← NEW!

---

## 🎯 How to Use

### For Students:

1. **Login as Student**
   - Go to http://localhost:3000
   - Login with student credentials

2. **Navigate to AI Tutor**
   - Click "AI Tutor" in the sidebar (🤖 icon)

3. **Upload Study Materials**
   - Click "Upload PDF"
   - Select a PDF file (textbooks, notes, etc.)
   - Wait for processing (usually 10-30 seconds)

4. **Ask Questions**
   - Type your question in the chat box
   - AI will answer based on your uploaded documents
   - Sources are cited for each answer

5. **Manage Documents**
   - View all uploaded PDFs
   - Delete documents you no longer need

6. **Clear Chat**
   - Click "Clear Chat" to start fresh

---

## 🧪 Testing

### Test the Integration:

1. **Upload a Test PDF**
   ```bash
   cd rag_chatbot_plugin
   .\test-upload.ps1 path\to\test.pdf
   ```

2. **Ask a Question**
   ```bash
   .\test-query.ps1 "What is the main topic?"
   ```

3. **Test via UI**
   - Login as student
   - Go to AI Tutor page
   - Upload a PDF
   - Ask questions

---

## 🔧 Architecture

```
Student Browser
    ↓
Main App (Port 3000)
    ↓ /api/chatbot/*
RAG Plugin (Port 4000)
    ↓
┌─────────────────────────────┐
│  Embedding Server (Port 8000) │
│  Qdrant (Port 6333)           │
│  Gemini API                   │
└─────────────────────────────┘
```

### Data Flow:

1. **Upload PDF**:
   - Student uploads PDF → Main app → RAG plugin
   - RAG plugin extracts text → Chunks text
   - Generates embeddings → Stores in Qdrant
   - Saves metadata in MySQL

2. **Ask Question**:
   - Student asks question → Main app → RAG plugin
   - RAG plugin generates query embedding
   - Searches Qdrant for relevant chunks
   - Sends chunks + question to Gemini
   - Returns AI-generated answer with sources

---

## 📊 Database Schema

### rag_documents
- Tracks uploaded PDFs per student
- Status: pending → processing → completed/failed

### rag_conversations
- Groups messages into conversations
- One conversation per student session

### rag_messages
- Stores individual chat messages
- Includes sources/citations

---

## 🔐 Security

- ✅ **Student Isolation**: Each student only sees their own documents
- ✅ **File Validation**: Only PDF files allowed
- ✅ **Size Limits**: 50MB max per file
- ✅ **Auth Required**: All endpoints require authentication
- ✅ **Data Privacy**: Documents stored per student, not shared

---

## 🚨 Troubleshooting

### RAG Plugin Won't Start

**Check if port 4000 is in use:**
```bash
netstat -ano | findstr :4000
```

**Check logs:**
```bash
cd rag_chatbot_plugin
npm run dev
```

### Embedding Server Not Running

```bash
cd rag_chatbot_plugin
python embedding_server.py
```

**If Python dependencies missing:**
```bash
pip install -r requirements.txt
```

### Qdrant Not Responding

```bash
cd rag_chatbot_plugin
docker-compose logs qdrant
```

**Restart Qdrant:**
```bash
docker-compose restart qdrant
```

### Upload Fails

- Check file is PDF format
- Check file size < 50MB
- Check RAG plugin is running
- Check embedding server is running

### Query Returns No Answer

- Ensure documents are uploaded and processed
- Check document status is "completed"
- Verify Gemini API key is valid
- Check Qdrant has embeddings

---

## 💡 Features

### Current Features:
- ✅ PDF upload and processing
- ✅ AI-powered Q&A
- ✅ Source citations
- ✅ Document management
- ✅ Clear chat history
- ✅ Student-specific documents

### Planned Features:
- 🔄 Conversation history persistence
- 🔄 Multi-document search
- 🔄 Export chat history
- 🔄 Share documents with classmates
- 🔄 Teacher-uploaded materials

---

## 📚 Additional Resources

- **RAG Plugin Docs**: `rag_chatbot_plugin/README.md`
- **Architecture**: `rag_chatbot_plugin/ARCHITECTURE.md`
- **Quick Start**: `rag_chatbot_plugin/QUICK_START.md`
- **Testing Guide**: `rag_chatbot_plugin/TESTING_GUIDE.md`

---

## 🎉 Success!

The RAG Chatbot is now integrated! Students can:
- 📤 Upload study materials
- 💬 Ask questions
- 🤖 Get AI-powered answers
- 📚 Manage their documents

**Next Steps:**
1. Get a Gemini API key
2. Start the embedding server
3. Start all services with `npm run dev:stack`
4. Test the AI Tutor page!

---

**Integration Date**: November 30, 2025  
**Status**: ✅ Complete and Ready to Use  
**Version**: 1.0.0

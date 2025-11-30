# Quick Start Guide

Get the RAG Chatbot running in 5 minutes!

## 1. Start Services (Docker)

```bash
docker-compose up -d
```

This starts:
- Qdrant (vector database)
- MySQL (metadata storage)
- Redis (optional caching)

## 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

## 3. Start Embedding Service

```bash
python embedding_server.py
```

Keep this running in a separate terminal.

## 4. Install Node Dependencies

```bash
npm install
```

## 5. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_key_here
```

## 6. Start Backend

```bash
npm run dev
```

## 7. Test It!

### Upload a PDF:
```powershell
.\test-upload.ps1 path\to\your\file.pdf
```

### Ask a question:
```powershell
.\test-query.ps1 "What is the main topic of the document?"
```

### Or use the web UI:
Open `public/index.html` in your browser.

## Troubleshooting

**Port already in use?**
- Qdrant: Change port in docker-compose.yml
- Backend: Change PORT in .env
- Embedding: Change port in embedding_server.py

**Can't connect to MySQL?**
```bash
docker-compose logs mysql
```

**Qdrant not responding?**
```bash
docker-compose logs qdrant
```

**Embedding service fails?**
Make sure you have Python 3.8+ and all dependencies installed.

## Next Steps

- Read ARCHITECTURE.md for system design
- Check SETUP.md for production deployment
- Integrate with your ERP system's authentication

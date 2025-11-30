# Getting Started with RAG Chatbot Plugin

## 🎯 What You'll Build

In the next 10 minutes, you'll have a working AI chatbot that:
- Accepts PDF uploads from students
- Extracts and indexes the content
- Answers questions using Gemini AI
- Provides citations to source material

## 📋 Prerequisites

Before starting, make sure you have:
- [x] Node.js 18+ installed
- [x] Python 3.8+ installed
- [x] Docker Desktop running
- [x] MySQL 8.0 (or use Docker)
- [x] A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## 🚀 Quick Start (5 Steps)

### Step 1: Start Required Services

```bash
cd rag_chatbot_plugin
docker-compose up -d
```

This starts:
- Qdrant (vector database) on port 6333
- MySQL (metadata storage) on port 3306
- Redis (optional caching) on port 6379

Verify they're running:
```bash
docker-compose ps
```

### Step 2: Install Dependencies

```bash
# Node.js dependencies
npm install

# Python dependencies
pip install -r requirements.txt
```

### Step 3: Start Embedding Service

Open a new terminal and run:
```bash
python embedding_server.py
```

You should see:
```
Starting embedding service on http://localhost:8000
Model: all-MiniLM-L6-v2 (384 dimensions)
```

Keep this terminal open!

### Step 4: Configure Environment

```bash
# Copy example config
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

That's the only required change for testing!

### Step 5: Start the Backend

```bash
npm run dev
```

You should see:
```
RAG Chatbot Plugin running on port 4000
Database initialized
Qdrant collection initialized
```

## 🎉 You're Ready!

### Test with Web UI

1. Open `public/index.html` in your browser
2. Click to select a PDF file
3. Click "Upload"
4. Wait for status to show "done"
5. Type a question in the chat box
6. Get an AI-generated answer with citations!

### Test with Command Line

Upload a PDF:
```powershell
.\test-upload.ps1 path\to\your\file.pdf
```

Ask a question:
```powershell
.\test-query.ps1 "What is the main topic of the document?"
```

## 📖 Example Workflow

Let's walk through a complete example:

### 1. Upload a PDF

```powershell
.\test-upload.ps1 "C:\Documents\biology_notes.pdf"
```

Output:
```
Uploading: biology_notes.pdf
Upload successful!
Upload ID: 1
Status: pending

Checking processing status...
Status: processing - Chunks: 0
Status: done - Chunks: 45

Processing complete! Ready to query.
```

### 2. Ask Questions

```powershell
.\test-query.ps1 "What is photosynthesis?"
```

Output:
```
Question: What is photosynthesis?

Answer:
Photosynthesis is the process by which plants convert light energy into 
chemical energy, producing glucose and oxygen from carbon dioxide and water.

Sources:
  - biology_notes.pdf (Page 12) - Score: 0.89
    Photosynthesis occurs in chloroplasts and involves two main stages...
  - biology_notes.pdf (Page 13) - Score: 0.85
    The light-dependent reactions capture energy from sunlight...
```

## 🔧 Configuration Options

### Basic Settings (in .env)

```env
# Server port
PORT=4000

# Gemini API key (required)
GEMINI_API_KEY=your_key_here

# Database (default works with Docker)
DB_HOST=localhost
DB_NAME=erp_rag
DB_USER=root
DB_PASSWORD=password

# Qdrant (default works with Docker)
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=erp_notes

# Embedding service (default works)
EMBEDDING_URL=http://localhost:8000/embed
```

### Advanced Settings

```env
# Chunking parameters
CHUNK_SIZE=400          # Tokens per chunk
CHUNK_OVERLAP=80        # Overlap between chunks

# Retrieval parameters
TOP_K_RESULTS=6         # Number of chunks to retrieve

# LLM settings
GEMINI_MODEL=gemini-2.5-pro  # Model to use
```

## 🐛 Troubleshooting

### Problem: "Cannot connect to Qdrant"

**Solution:**
```bash
# Check if Qdrant is running
docker-compose ps

# Restart if needed
docker-compose restart qdrant

# Check logs
docker-compose logs qdrant
```

### Problem: "Embedding service not responding"

**Solution:**
```bash
# Make sure Python server is running
python embedding_server.py

# Test it directly
curl http://localhost:8000/health
```

### Problem: "Database connection failed"

**Solution:**
```bash
# Check MySQL is running
docker-compose ps mysql

# Check credentials in .env match docker-compose.yml
# Default: root/password

# Restart MySQL
docker-compose restart mysql
```

### Problem: "Gemini API error"

**Solution:**
- Verify your API key is correct in `.env`
- Check you have API quota remaining
- Ensure you're using the right model name

### Problem: "Upload fails with 'Only PDF files allowed'"

**Solution:**
- Ensure file has `.pdf` extension
- Verify file is actually a PDF (not renamed)
- Check file isn't corrupted

## 📊 Understanding the System

### What Happens When You Upload?

1. **Upload** → File received, record created in MySQL
2. **Extract** → Text extracted from PDF pages
3. **Chunk** → Text split into ~400 token chunks with overlap
4. **Embed** → Each chunk converted to 384-dim vector
5. **Store** → Vectors + metadata saved to Qdrant
6. **Done** → Status updated, ready for queries

### What Happens When You Query?

1. **Embed** → Your question converted to vector
2. **Search** → Find top 6 most similar chunks in Qdrant
3. **Filter** → Apply access control (student/class)
4. **Context** → Build context from retrieved chunks
5. **Prompt** → Send context + question to Gemini
6. **Answer** → Return AI response with citations

## 🎓 Next Steps

### For Development

1. **Add Authentication**
   - Integrate with your ERP's JWT tokens
   - Update `auth.middleware.ts`

2. **Customize Chunking**
   - Adjust `CHUNK_SIZE` and `CHUNK_OVERLAP`
   - Experiment with different values

3. **Tune Retrieval**
   - Change `TOP_K_RESULTS`
   - Modify similarity threshold

4. **Enhance Prompts**
   - Edit prompt template in `llm.service.ts`
   - Add domain-specific instructions

### For Production

1. **Scale Qdrant**
   - Increase RAM allocation
   - Use persistent volumes
   - Consider managed hosting

2. **Add Caching**
   - Enable Redis in `.env`
   - Cache common queries
   - Reduce LLM costs

3. **Monitor Performance**
   - Add Prometheus metrics
   - Set up Grafana dashboards
   - Configure alerts

4. **Backup Data**
   - Schedule MySQL backups
   - Export Qdrant collections
   - Store PDFs in object storage

## 📚 Learn More

- **Architecture**: Read `ARCHITECTURE.md` for system design
- **Full Setup**: See `SETUP.md` for production deployment
- **API Reference**: Check `README.md` for endpoint details
- **Original Spec**: Review `doc/rag_chatbot_architecture_for_erp.md`

## 💡 Tips & Best Practices

### For Better Results

1. **Upload Quality PDFs**
   - Text-based PDFs work best
   - Scanned PDFs need OCR (not included)
   - Clean, well-formatted documents

2. **Ask Specific Questions**
   - "What is X?" works better than "Tell me about X"
   - Reference specific topics from the PDF
   - Use keywords from the document

3. **Check Citations**
   - Always verify the source pages
   - Higher scores = more relevant
   - Multiple sources = more confident answer

### For Better Performance

1. **Batch Uploads**
   - Upload multiple PDFs at once
   - Processing happens in parallel
   - More content = better answers

2. **Optimize Chunks**
   - Smaller chunks = more precise
   - Larger chunks = more context
   - Find the right balance

3. **Monitor Resources**
   - Qdrant uses RAM heavily
   - Scale up if searches slow down
   - Consider SSD for faster I/O

## 🎉 Success!

You now have a working RAG chatbot! Students can:
- Upload their study materials
- Ask questions anytime
- Get instant, accurate answers
- See exactly where information came from

The system is:
- ✅ Running locally
- ✅ Processing PDFs
- ✅ Answering questions
- ✅ Tracking sources
- ✅ Ready to integrate

## 🤝 Need Help?

- Check `TROUBLESHOOTING.md` for common issues
- Review logs in the terminal
- Test each component individually
- Verify all services are running

Happy building! 🚀

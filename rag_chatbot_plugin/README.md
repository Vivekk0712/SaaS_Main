# RAG Chatbot Plugin for School ERP

A standalone RAG (Retrieval-Augmented Generation) plugin that integrates with School ERP systems. Students upload PDFs, and the system answers queries using LLM with retrieved context.

## Features

- PDF-only uploads with text extraction
- Vector embeddings using free open-source models
- Qdrant vector database for semantic search
- LangChain orchestration
- Gemini 2.5 Pro for answer generation
- Multi-tenant security with class/student isolation
- Citation tracking with source references

## Architecture

See `doc/rag_chatbot_architecture_for_erp.md` for detailed architecture.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start required services:
- Qdrant (Docker): `docker run -p 6333:6333 qdrant/qdrant`
- MySQL database
- Redis (optional)

4. Run development server:
```bash
npm run dev
```

## API Endpoints

- `POST /api/upload` - Upload PDF file
- `GET /api/upload/:id/status` - Check ingestion status
- `POST /api/query` - Ask questions
- `GET /api/conversations/:userId` - Get chat history
- `POST /api/admin/reindex` - Reindex documents (admin only)

## Environment Variables

See `.env.example` for all configuration options.

## Deployment

Recommended VM specs for ~1000 students:
- CPU: 4 vCPU
- RAM: 16-32 GB
- Disk: 100-200 GB SSD
- Qdrant on same VM or separate instance

## Migration to Pinecone

The system is designed to easily migrate from Qdrant to Pinecone. See architecture doc for migration steps.

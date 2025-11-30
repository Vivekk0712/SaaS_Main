# RAG Chatbot Plugin - Architecture Overview

This document provides a high-level overview of the implementation based on `doc/rag_chatbot_architecture_for_erp.md`.

## System Components

### Backend (Node.js + Express)
- **Entry Point**: `src/index.ts`
- **Configuration**: `src/config/` - env, database, logger
- **Services**: Core business logic
  - `pdf.service.ts` - PDF text extraction
  - `chunking.service.ts` - Text chunking with overlap
  - `embedding.service.ts` - Vector embeddings via external service
  - `qdrant.service.ts` - Vector database operations
  - `llm.service.ts` - LangChain + Gemini integration
- **Controllers**: HTTP request handlers
- **Middleware**: Authentication and authorization
- **Routes**: API endpoints

### Frontend (React)
- Single-page test UI in `public/index.html`
- Features: PDF upload, status tracking, chat interface, citations display

### External Services
- **Qdrant**: Vector database (self-hosted via Docker)
- **Embedding Service**: Python FastAPI server with sentence-transformers
- **Gemini 2.5 Pro**: LLM for answer generation
- **MySQL**: Metadata storage

## Data Flow

### Upload Flow
1. User uploads PDF → `POST /api/upload`
2. File saved to memory, record created in DB
3. Async processing starts:
   - Extract text from PDF pages
   - Chunk text with overlap
   - Generate embeddings in batches
   - Upsert vectors + metadata to Qdrant
4. Status updated to 'done'

### Query Flow
1. User asks question → `POST /api/query`
2. Question embedded to vector
3. Qdrant search with filters (class/student isolation)
4. Top-K chunks retrieved
5. Context built from chunks
6. LangChain prompts Gemini with context
7. Answer + citations returned

## Security

- JWT authentication from ERP
- Role-based access control
- Multi-tenant isolation via metadata filters
- Students see only their uploads
- Teachers see class-wide content

## Database Schema

### uploads table
- Stores PDF metadata and ownership
- Links to Qdrant collection

### ingestion_jobs table
- Tracks processing status
- Records chunk counts and errors

## Vector Storage

Each vector in Qdrant includes payload:
```json
{
  "uploadId": 123,
  "studentId": 456,
  "classId": 10,
  "fileName": "notes.pdf",
  "page": 3,
  "chunkIndex": 7,
  "textExcerpt": "..."
}
```

## Configuration

All settings via environment variables:
- Server config (port, env)
- JWT keys
- Database credentials
- Qdrant connection
- Gemini API key
- Processing parameters (chunk size, top-K)

## Scalability Considerations

- Async processing prevents blocking uploads
- Batch embedding reduces API calls
- Qdrant RAM-based for fast retrieval
- Redis caching (optional) for common queries
- Horizontal scaling possible with load balancer

## Migration Path

System designed for easy migration from Qdrant to Pinecone:
- Point IDs are portable
- Payload structure is standardized
- Service layer abstraction allows swapping vector DB

## Next Steps

1. Add conversation history storage
2. Implement Redis caching
3. Add admin reindex endpoint
4. Create monitoring dashboard
5. Add support for multiple file formats (future)

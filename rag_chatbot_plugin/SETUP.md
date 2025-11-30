# RAG Chatbot Plugin - Setup Guide

## Prerequisites

1. Node.js 18+ and npm
2. MySQL 8.0+
3. Docker (for Qdrant)
4. Gemini API key

## Step 1: Install Dependencies

```bash
cd rag_chatbot_plugin
npm install
```

## Step 2: Start Qdrant

```bash
docker run -p 6333:6333 -v qdrant_storage:/qdrant/storage qdrant/qdrant
```

## Step 3: Setup MySQL Database

```sql
CREATE DATABASE erp_rag;
```

The tables will be created automatically on first run.

## Step 4: Setup Embedding Service

You need a local embedding service. Quick option using Python:

```bash
pip install sentence-transformers fastapi uvicorn
```

Create `embedding_server.py`:

```python
from fastapi import FastAPI
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel

app = FastAPI()
model = SentenceTransformer('all-MiniLM-L6-v2')

class EmbedRequest(BaseModel):
    texts: list[str]
    model: str = 'all-MiniLM-L6-v2'

@app.post("/embed")
def embed(request: EmbedRequest):
    embeddings = model.encode(request.texts).tolist()
    return {"embeddings": embeddings}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Run it:
```bash
python embedding_server.py
```

## Step 5: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:
- Add your Gemini API key
- Configure MySQL credentials
- Set JWT secret

## Step 6: Start the Backend

```bash
npm run dev
```

## Step 7: Test the Frontend

Open `public/index.html` in your browser or serve it:

```bash
npx http-server public -p 3000
```

## Testing

1. Upload a PDF file
2. Wait for processing to complete
3. Ask questions about the content
4. Check citations in responses

## Production Deployment

1. Build TypeScript:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

3. Use a process manager like PM2:
```bash
pm2 start dist/index.js --name rag-chatbot
```

## Troubleshooting

- **Qdrant connection failed**: Ensure Docker container is running
- **Embedding service error**: Check if Python server is running on port 8000
- **Database errors**: Verify MySQL credentials and database exists
- **Upload fails**: Check file size limits and PDF validity

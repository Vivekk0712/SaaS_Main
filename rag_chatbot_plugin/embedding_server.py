"""
Simple embedding server using sentence-transformers
Run: python embedding_server.py
"""
from fastapi import FastAPI
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel
from typing import List
import uvicorn

app = FastAPI(title="Embedding Service")

# Load model on startup
model = SentenceTransformer('all-MiniLM-L6-v2')

class EmbedRequest(BaseModel):
    texts: List[str]
    model: str = 'all-MiniLM-L6-v2'

class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    dimension: int
    model: str

@app.post("/embed", response_model=EmbedResponse)
def embed(request: EmbedRequest):
    """Generate embeddings for input texts"""
    embeddings = model.encode(request.texts, show_progress_bar=False).tolist()
    
    return {
        "embeddings": embeddings,
        "dimension": len(embeddings[0]) if embeddings else 0,
        "model": request.model
    }

@app.get("/health")
def health():
    return {"status": "ok", "model": "all-MiniLM-L6-v2", "dimension": 384}

if __name__ == "__main__":
    print("Starting embedding service on http://localhost:8000")
    print("Model: all-MiniLM-L6-v2 (384 dimensions)")
    uvicorn.run(app, host="0.0.0.0", port=8000)

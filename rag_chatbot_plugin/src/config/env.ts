import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  jwt: {
    publicKey: process.env.JWT_PUBLIC_KEY || '',
    secret: process.env.JWT_SECRET || 'dev-secret'
  },
  
  erp: {
    apiUrl: process.env.ERP_API_URL || ''
  },
  
  objectStore: {
    type: process.env.OBJECT_STORE_TYPE || 'minio',
    url: process.env.OBJECT_STORE_URL || 'http://localhost:9000',
    accessKey: process.env.OBJECT_STORE_ACCESS_KEY || '',
    secretKey: process.env.OBJECT_STORE_SECRET_KEY || '',
    bucket: process.env.OBJECT_STORE_BUCKET || 'erp-pdfs'
  },
  
  embedding: {
    url: process.env.EMBEDDING_URL || 'http://localhost:8000/embed',
    batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || '64', 10),
    dimension: parseInt(process.env.EMBEDDING_DIM || '384', 10),
    model: process.env.EMBEDDING_MODEL || 'all-MiniLM-L6-v2'
  },
  
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY || '',
    collection: process.env.QDRANT_COLLECTION || 'erp_notes'
  },
  
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-pro'
  },
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'erp_rag'
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED === 'true'
  },
  
  processing: {
    chunkSize: parseInt(process.env.CHUNK_SIZE || '400', 10),
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '80', 10),
    topK: parseInt(process.env.TOP_K_RESULTS || '6', 10)
  }
};

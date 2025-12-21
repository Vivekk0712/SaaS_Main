import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config/env';
import { logger } from '../config/logger';

export interface VectorPayload {
  uploadId: number;
  studentId: number;
  classId: number;
  fileName: string;
  page: number;
  chunkIndex: number;
  textExcerpt: string;
}

export interface SearchResult {
  id: string;
  score: number;
  payload: VectorPayload;
}

export class QdrantService {
  private client: QdrantClient;
  private collection: string;
  
  constructor() {
    this.client = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey || undefined
    });
    this.collection = config.qdrant.collection;
  }
  
  async initCollection(): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(c => c.name === this.collection);
      
      if (!exists) {
        await this.client.createCollection(this.collection, {
          vectors: {
            size: config.embedding.dimension,
            distance: 'Cosine'
          }
        });
        logger.info(`Created Qdrant collection: ${this.collection}`);
      }
    } catch (error) {
      logger.error('Failed to initialize Qdrant collection', error);
      throw error;
    }
  }
  
  async upsertVectors(
    vectors: number[][],
    payloads: VectorPayload[]
  ): Promise<void> {
    try {
      const points = vectors.map((vector, idx) => ({
        // Use a numeric ID: uploadId * 1000000 + chunkIndex to ensure uniqueness
        id: payloads[idx].uploadId * 1000000 + payloads[idx].chunkIndex,
        vector,
        payload: payloads[idx]
      }));
      
      await this.client.upsert(this.collection, {
        wait: true,
        points
      });
      
      logger.info(`Upserted ${points.length} vectors to Qdrant`);
    } catch (error) {
      logger.error('Failed to upsert vectors', error);
      throw error;
    }
  }
  
  async search(
    queryVector: number[],
    filters: { 
      classId?: number; 
      studentId?: number;
      klass?: string;
      section?: string;
      subject?: string;
      chapterId?: string;
    },
    topK: number = config.processing.topK
  ): Promise<SearchResult[]> {
    try {
      const filter: any = {};
      
      if (filters.classId) {
        filter.must = filter.must || [];
        filter.must.push({ key: 'classId', match: { value: filters.classId } });
      }
      
      if (filters.studentId) {
        filter.must = filter.must || [];
        filter.must.push({ key: 'studentId', match: { value: filters.studentId } });
      }
      
      // Add teacher material filters
      if (filters.klass) {
        filter.must = filter.must || [];
        filter.must.push({ key: 'klass', match: { value: filters.klass } });
      }
      
      if (filters.section) {
        filter.must = filter.must || [];
        filter.must.push({ key: 'section', match: { value: filters.section } });
      }
      
      if (filters.subject) {
        filter.must = filter.must || [];
        filter.must.push({ key: 'subject', match: { value: filters.subject } });
      }
      
      if (filters.chapterId) {
        filter.must = filter.must || [];
        filter.must.push({ key: 'chapterId', match: { value: filters.chapterId } });
      }
      
      const results = await this.client.search(this.collection, {
        vector: queryVector,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        limit: topK,
        with_payload: true
      });
      
      return results.map(r => ({
        id: r.id.toString(),
        score: r.score,
        payload: r.payload as VectorPayload
      }));
    } catch (error) {
      logger.error('Search failed', error);
      throw error;
    }
  }
  
  async deleteByUploadId(uploadId: number): Promise<void> {
    try {
      await this.client.delete(this.collection, {
        filter: {
          must: [{ key: 'uploadId', match: { value: uploadId } }]
        }
      });
      logger.info(`Deleted vectors for upload ${uploadId}`);
    } catch (error) {
      logger.error('Failed to delete vectors', error);
      throw error;
    }
  }
}

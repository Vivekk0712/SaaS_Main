import { config } from '../config/env';
import { logger } from '../config/logger';

export class EmbeddingService {
  private embeddingUrl: string;
  private batchSize: number;
  
  constructor() {
    this.embeddingUrl = config.embedding.url;
    this.batchSize = config.embedding.batchSize;
  }
  
  async embedTexts(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      const batchEmbeddings = await this.embedBatch(batch);
      embeddings.push(...batchEmbeddings);
      
      logger.debug(`Embedded batch ${i / this.batchSize + 1}/${Math.ceil(texts.length / this.batchSize)}`);
    }
    
    return embeddings;
  }
  
  async embedSingle(text: string): Promise<number[]> {
    const embeddings = await this.embedBatch([text]);
    return embeddings[0];
  }
  
  private async embedBatch(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch(this.embeddingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts, model: config.embedding.model })
      });
      
      if (!response.ok) {
        throw new Error(`Embedding service error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.embeddings;
    } catch (error) {
      logger.error('Embedding failed', error);
      throw new Error('Failed to generate embeddings');
    }
  }
}

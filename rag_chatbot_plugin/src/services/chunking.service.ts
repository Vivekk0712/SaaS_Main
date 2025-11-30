import { config } from '../config/env';
import { logger } from '../config/logger';

export interface Chunk {
  text: string;
  pageNumber: number;
  chunkIndex: number;
  startChar: number;
  endChar: number;
}

export class ChunkingService {
  private chunkSize: number;
  private overlap: number;
  
  constructor() {
    this.chunkSize = config.processing.chunkSize;
    this.overlap = config.processing.chunkOverlap;
  }
  
  chunkPages(pages: Array<{ pageNumber: number; text: string }>): Chunk[] {
    const chunks: Chunk[] = [];
    let globalChunkIndex = 0;
    
    for (const page of pages) {
      const pageChunks = this.chunkText(page.text, page.pageNumber);
      pageChunks.forEach(chunk => {
        chunks.push({ ...chunk, chunkIndex: globalChunkIndex++ });
      });
    }
    
    logger.info(`Created ${chunks.length} chunks from ${pages.length} pages`);
    return chunks;
  }
  
  private chunkText(text: string, pageNumber: number): Omit<Chunk, 'chunkIndex'>[] {
    const chunks: Omit<Chunk, 'chunkIndex'>[] = [];
    const tokens = this.tokenize(text);
    
    let start = 0;
    while (start < tokens.length) {
      const end = Math.min(start + this.chunkSize, tokens.length);
      const chunkTokens = tokens.slice(start, end);
      const chunkText = chunkTokens.join(' ');
      
      chunks.push({
        text: chunkText,
        pageNumber,
        startChar: start,
        endChar: end
      });
      
      start += this.chunkSize - this.overlap;
    }
    
    return chunks;
  }
  
  private tokenize(text: string): string[] {
    // Simple whitespace tokenization
    return text.split(/\s+/).filter(t => t.length > 0);
  }
}

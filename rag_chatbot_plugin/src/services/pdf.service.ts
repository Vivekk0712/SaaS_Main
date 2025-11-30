import pdfParse from 'pdf-parse';
import { logger } from '../config/logger';

export interface PDFPage {
  pageNumber: number;
  text: string;
}

export class PDFService {
  async extractText(buffer: Buffer): Promise<PDFPage[]> {
    try {
      const data = await pdfParse(buffer);
      
      // Split by page if possible, otherwise treat as single page
      const pages: PDFPage[] = [];
      const pageTexts = this.splitIntoPages(data.text, data.numpages);
      
      pageTexts.forEach((text, index) => {
        if (text.trim()) {
          pages.push({
            pageNumber: index + 1,
            text: this.cleanText(text)
          });
        }
      });
      
      logger.info(`Extracted ${pages.length} pages from PDF`);
      return pages;
    } catch (error) {
      logger.error('PDF extraction failed', error);
      throw new Error('Failed to extract text from PDF');
    }
  }
  
  private splitIntoPages(text: string, numPages: number): string[] {
    // Simple heuristic: split by form feed or divide equally
    const pages = text.split('\f');
    if (pages.length === numPages) {
      return pages;
    }
    
    // Fallback: divide text equally
    const chunkSize = Math.ceil(text.length / numPages);
    const result: string[] = [];
    for (let i = 0; i < numPages; i++) {
      result.push(text.slice(i * chunkSize, (i + 1) * chunkSize));
    }
    return result;
  }
  
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[^\S\n]+/g, ' ')
      .trim();
  }
}

import { Request, Response } from 'express';
import { getDatabase } from '../config/database';
import { PDFService } from '../services/pdf.service';
import { ChunkingService } from '../services/chunking.service';
import { EmbeddingService } from '../services/embedding.service';
import { QdrantService } from '../services/qdrant.service';
import { logger } from '../config/logger';
import { config } from '../config/env';

export class UploadController {
  private pdfService = new PDFService();
  private chunkingService = new ChunkingService();
  private embeddingService = new EmbeddingService();
  private qdrantService = new QdrantService();
  
  upload = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const db = getDatabase();
      
      // Check if metadata is provided (teacher upload) or use user context (student upload)
      let metadata: any = {};
      if (req.body.metadata) {
        try {
          metadata = typeof req.body.metadata === 'string' 
            ? JSON.parse(req.body.metadata) 
            : req.body.metadata;
        } catch (e) {
          logger.warn('Failed to parse metadata', e);
        }
      }
      
      // Determine if this is a teacher or student upload
      const isTeacherUpload = !!(metadata.klass && metadata.section && metadata.subject);
      const studentId = isTeacherUpload ? 0 : (req.user?.id || 0); // 0 for teacher uploads
      const classId = req.user?.classId || 0;
      
      // Save upload record
      const [result] = await db.execute(
        'INSERT INTO uploads (file_name, file_path, student_id, class_id, qdrant_collection) VALUES (?, ?, ?, ?, ?)',
        [req.file.originalname, `temp/${Date.now()}_${req.file.originalname}`, studentId, classId, config.qdrant.collection]
      );
      
      const uploadId = (result as any).insertId;
      
      // Create ingestion job
      await db.execute(
        'INSERT INTO ingestion_jobs (upload_id, status) VALUES (?, ?)',
        [uploadId, 'pending']
      );
      
      // Process asynchronously with metadata
      this.processUpload(
        uploadId, 
        req.file.buffer, 
        req.file.originalname, 
        studentId, 
        classId,
        metadata
      ).catch(err => logger.error('Upload processing failed', err));
      
      res.json({ uploadId, status: 'pending', isTeacherUpload });
    } catch (error) {
      logger.error('Upload failed', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  };
  
  getStatus = async (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const [rows] = await db.execute(
        'SELECT * FROM ingestion_jobs WHERE upload_id = ?',
        [req.params.id]
      );
      
      const jobs = rows as any[];
      if (jobs.length === 0) {
        return res.status(404).json({ error: 'Upload not found' });
      }
      
      res.json(jobs[0]);
    } catch (error) {
      logger.error('Status check failed', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  };
  
  listDocuments = async (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const user = req.user!;
      const studentId = req.query.studentId || user.id;
      
      const [rows] = await db.execute(
        `SELECT u.id, u.file_name as filename, u.uploaded_at as created_at, 
                j.status as upload_status, j.chunks_count as chunk_count
         FROM uploads u
         LEFT JOIN ingestion_jobs j ON u.id = j.upload_id
         WHERE u.student_id = ?
         ORDER BY u.uploaded_at DESC`,
        [studentId]
      );
      
      res.json({ documents: rows });
    } catch (error) {
      logger.error('List documents failed', error);
      res.status(500).json({ error: 'Failed to list documents' });
    }
  };
  
  deleteDocument = async (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const documentId = req.params.id;
      
      // Delete from database
      await db.execute('DELETE FROM uploads WHERE id = ?', [documentId]);
      
      // TODO: Delete from Qdrant vector store
      
      res.json({ success: true });
    } catch (error) {
      logger.error('Delete document failed', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  };
  
  private async processUpload(
    uploadId: number,
    buffer: Buffer,
    fileName: string,
    studentId: number,
    classId: number,
    metadata: any = {}
  ) {
    const db = getDatabase();
    
    try {
      await db.execute(
        'UPDATE ingestion_jobs SET status = ? WHERE upload_id = ?',
        ['processing', uploadId]
      );
      
      // Extract text from PDF
      const pages = await this.pdfService.extractText(buffer);
      
      // Chunk text
      const chunks = this.chunkingService.chunkPages(pages);
      
      // Generate embeddings
      const texts = chunks.map(c => c.text);
      const embeddings = await this.embeddingService.embedTexts(texts);
      
      // Prepare payloads with metadata
      const payloads = chunks.map((chunk, idx) => ({
        uploadId,
        studentId,
        classId,
        fileName,
        page: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        textExcerpt: chunk.text.substring(0, 500),
        // Add teacher upload metadata
        klass: metadata.klass || '',
        section: metadata.section || '',
        subject: metadata.subject || '',
        chapterId: metadata.chapterId || '',
        type: metadata.type || '',
        b2Key: metadata.b2Key || '',
      }));
      
      // Upsert to Qdrant
      await this.qdrantService.upsertVectors(embeddings, payloads);
      
      // Mark as done
      await db.execute(
        'UPDATE ingestion_jobs SET status = ?, processed_at = NOW(), chunks_count = ? WHERE upload_id = ?',
        ['done', chunks.length, uploadId]
      );
      
      logger.info(`Successfully processed upload ${uploadId} with metadata`, metadata);
    } catch (error) {
      logger.error(`Processing failed for upload ${uploadId}`, error);
      await db.execute(
        'UPDATE ingestion_jobs SET status = ?, error_message = ? WHERE upload_id = ?',
        ['failed', (error as Error).message, uploadId]
      );
    }
  }
}

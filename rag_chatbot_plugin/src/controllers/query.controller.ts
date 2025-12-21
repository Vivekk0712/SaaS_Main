import { Request, Response } from 'express';
import { EmbeddingService } from '../services/embedding.service';
import { QdrantService } from '../services/qdrant.service';
import { LLMService } from '../services/llm.service';
import { logger } from '../config/logger';

export class QueryController {
  private embeddingService = new EmbeddingService();
  private qdrantService = new QdrantService();
  private llmService = new LLMService();
  
  query = async (req: Request, res: Response) => {
    try {
      const { question, filters = {} } = req.body;
      const user = req.user!;
      
      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }
      
      // Apply filters based on context
      const searchFilters: any = { ...filters };
      
      // If querying teacher materials (has klass/section/subject), don't filter by studentId
      const isTeacherMaterialQuery = !!(filters.klass && filters.section && filters.subject);
      
      if (!isTeacherMaterialQuery) {
        // Student's own uploads - filter by studentId
        if (user.role === 'student') {
          searchFilters.studentId = user.id;
        } else if (user.role === 'teacher' && user.classId) {
          searchFilters.classId = user.classId;
        }
      }
      // For teacher materials, use the provided filters (klass, section, subject, chapterId)
      
      // Embed question
      const queryVector = await this.embeddingService.embedSingle(question);
      
      // Search Qdrant
      const searchResults = await this.qdrantService.search(queryVector, searchFilters);
      
      if (searchResults.length === 0) {
        return res.json({
          answer: "I don't have enough information in the uploaded notes to answer that.",
          citations: []
        });
      }
      
      // Generate answer with LLM
      const response = await this.llmService.generateAnswer(question, searchResults);
      
      logger.info(`Query answered for user ${user.id}`);
      res.json(response);
    } catch (error) {
      logger.error('Query failed', error);
      res.status(500).json({ error: 'Query failed' });
    }
  };
  
  getConversations = async (req: Request, res: Response) => {
    try {
      // TODO: Implement conversation history storage
      res.json({ conversations: [] });
    } catch (error) {
      logger.error('Failed to get conversations', error);
      res.status(500).json({ error: 'Failed to get conversations' });
    }
  };
}

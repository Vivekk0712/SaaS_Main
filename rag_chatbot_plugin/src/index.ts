import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { logger } from './config/logger';
import { initDatabase } from './config/database';
import { QdrantService } from './services/qdrant.service';
import uploadRoutes from './routes/upload.routes';
import queryRoutes from './routes/query.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', uploadRoutes);
app.use('/api', queryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Initialize and start
async function start() {
  try {
    // Initialize database
    await initDatabase();
    logger.info('Database initialized');
    
    // Initialize Qdrant collection
    const qdrantService = new QdrantService();
    await qdrantService.initCollection();
    logger.info('Qdrant collection initialized');
    
    // Start server
    app.listen(config.port, () => {
      logger.info(`RAG Chatbot Plugin running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

start();

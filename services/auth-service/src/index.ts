import express from 'express';
import dotenv from 'dotenv';
import { connectMongo, connectRabbit, closeMongo, closeRabbit, logger } from '@school-sas/shared-lib';

dotenv.config();

const PORT = Number(process.env.PORT || 3001);
const MONGODB_URI = process.env.MONGODB_URI || '';
const RABBITMQ_URL = process.env.RABBITMQ_URL || '';

async function bootstrap() {
  const app = express();
  app.use(express.json());

  app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.get('/readyz', (_req, res) => res.status(200).json({ status: 'ready' }));

  // Placeholder: auth routes
  app.post('/v1/auth/login', (_req, res) => res.status(501).json({ error: 'not_implemented' }));

  try {
    if (MONGODB_URI) await connectMongo(MONGODB_URI);
    if (RABBITMQ_URL) await connectRabbit(RABBITMQ_URL);
  } catch (err) {
    logger.error('Startup dependency error', { err: (err as Error).message });
  }

  const server = app.listen(PORT, () => logger.info('Auth service started', { port: PORT }));

  const shutdown = async () => {
    logger.info('Shutting down');
    server.close(() => logger.info('HTTP server closed'));
    await closeMongo();
    await closeRabbit();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((e) => {
  logger.error('Bootstrap failed', { err: (e as Error).message });
  process.exit(1);
});


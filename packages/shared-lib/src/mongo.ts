import { MongoClient } from 'mongodb';
import { logger } from './logger';

export type MongoConnections = {
  client: MongoClient;
};

let cached: MongoConnections | null = null;

export async function connectMongo(uri: string): Promise<MongoConnections> {
  if (cached) return cached;
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverApi: { version: '1', strict: true, deprecationErrors: true } as any,
  });
  await client.connect();
  logger.info('Mongo connected');
  cached = { client };
  return cached;
}

export async function closeMongo() {
  if (cached) {
    await cached.client.close();
    cached = null;
    logger.info('Mongo disconnected');
  }
}


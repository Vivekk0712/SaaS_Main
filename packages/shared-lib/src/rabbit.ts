import amqp, { Channel, Connection, Options } from 'amqplib';
import { logger } from './logger';

export type RabbitConn = { conn: Connection; ch: Channel };

let cached: RabbitConn | null = null;

export async function connectRabbit(url: string, socketOptions?: Options.Connect): Promise<RabbitConn> {
  if (cached) return cached;
  const conn = await amqp.connect(url, socketOptions);
  const ch = await conn.createChannel();
  logger.info('RabbitMQ connected');
  cached = { conn: conn as unknown as Connection, ch: ch as unknown as Channel };
  return cached as RabbitConn;
}

export async function closeRabbit() {
  if (cached) {
    await cached.ch.close();
    await (cached.conn as any).close();
    cached = null;
    logger.info('RabbitMQ disconnected');
  }
}
import { SQSClient, DeleteMessageCommand, ReceiveMessageCommand } from "@aws-sdk/client-sqs";
import { z } from "zod";

import type { AppConfig } from "../config/index.js";
import { logger } from "../utils/logger.js";
import type { MessageJob } from "../domain/types.js";
import type { WhatsAppService } from "../services/whatsappService.js";

const messageSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  type: z.union([z.literal("transactional"), z.literal("bulk"), z.literal("otp")]),
  templateName: z.string(),
  language: z.string().default("en_US"),
  payload: z.record(z.any()),
  recipients: z
    .array(
      z.object({
        phone: z.string().min(6),
        name: z.string().optional(),
        substitutions: z.record(z.any()).optional()
      })
    )
    .min(1),
  priority: z.union([z.literal("high"), z.literal("normal"), z.literal("low")]),
  scheduledAt: z.string().optional(),
  attempts: z.number().default(0),
  status: z.union([z.literal("pending"), z.literal("sent"), z.literal("partial"), z.literal("failed")]).default("pending"),
  idempotencyKey: z.string()
});

type MessageSchema = z.infer<typeof messageSchema>;

export interface QueueConsumerOptions {
  config: AppConfig;
  whatsappService: WhatsAppService;
}

export class MessageQueueConsumer {
  private readonly sqsClient: SQSClient;
  private readonly config: AppConfig;
  private readonly whatsappService: WhatsAppService;
  private readonly queueConfig: Extract<AppConfig["queue"], { mode: "sqs" }>;
  private shouldStop = false;

  constructor({ config, whatsappService }: QueueConsumerOptions) {
    this.config = config;
    this.whatsappService = whatsappService;
    if (config.queue.mode !== "sqs") {
      throw new Error("MessageQueueConsumer requires SQS queue mode");
    }
    this.queueConfig = config.queue;
    this.sqsClient = new SQSClient({ region: config.whatsapp.region });
  }

  async start(): Promise<void> {
    logger.info("starting whatsapp queue consumer");
    this.shouldStop = false;
    while (!this.shouldStop) {
      await this.poll();
    }
  }

  stop(): void {
    logger.info("stopping whatsapp queue consumer");
    this.shouldStop = true;
  }

  private async poll(): Promise<void> {
    const queue = this.queueConfig;
    const receiveCommand = new ReceiveMessageCommand({
      QueueUrl: queue.sendQueueUrl,
      MaxNumberOfMessages: queue.maxNumberOfMessages,
      WaitTimeSeconds: queue.waitTimeSeconds,
      VisibilityTimeout: queue.visibilityTimeout
    });

    const { Messages } = await this.sqsClient.send(receiveCommand);
    if (!Messages || Messages.length === 0) return;

    await Promise.all(
      Messages.map(async (message) => {
        if (!message.Body) return;
        try {
          const job = this.parseMessage(message.Body);
          const result = await this.whatsappService.process(job);
          logger.info({ jobId: job.id, result }, "whatsapp job processed");
          if (message.ReceiptHandle) {
            await this.sqsClient.send(
              new DeleteMessageCommand({ QueueUrl: queue.sendQueueUrl, ReceiptHandle: message.ReceiptHandle })
            );
          }
        } catch (error) {
          logger.error({ err: error as Error }, "failed to process SQS message");
        }
      })
    );
  }

  private parseMessage(body: string): MessageJob {
    const raw = JSON.parse(body) as MessageSchema;
    const message = messageSchema.parse(raw);
    return {
      id: message.id,
      tenantId: message.tenantId,
      type: message.type,
      templateName: message.templateName,
      language: message.language,
      payload: message.payload,
      recipients: message.recipients,
      priority: message.priority,
      scheduledAt: message.scheduledAt,
      attempts: message.attempts,
      status: message.status,
      idempotencyKey: message.idempotencyKey
    };
  }
}



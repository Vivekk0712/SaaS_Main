import { Router } from "express";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { z } from "zod";
import { v4 as uuid } from "uuid";

import type { AppConfig } from "../config/index.js";
import type { MessageJob } from "../domain/types.js";
import type { WhatsAppService } from "../services/whatsappService.js";
import { createIdempotencyKey } from "../utils/idempotency.js";
import { logger } from "../utils/logger.js";

const createMessageSchema = z.object({
  tenantId: z.string(),
  type: z.union([z.literal("transactional"), z.literal("bulk"), z.literal("otp"), z.literal("session_text")]),
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
  priority: z.union([z.literal("high"), z.literal("normal"), z.literal("low")]).default("normal"),
  scheduledAt: z.string().optional(),
  idempotencyKey: z.string().optional()
});

interface MessageJobsRouterDependencies {
  whatsappService: WhatsAppService;
}

export const createMessageJobsRouter = (
  config: AppConfig,
  { whatsappService }: MessageJobsRouterDependencies
): Router => {
  const router = Router();
  const sqsClient = config.queue.mode === "sqs" ? new SQSClient({ region: config.whatsapp.region }) : null;

  router.post("/", async (req, res) => {
    const parseResult = createMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ errors: parseResult.error.flatten().fieldErrors });
    }

    const payload = parseResult.data;
    const jobId = uuid();
    const idempotencyKey = payload.idempotencyKey ?? createIdempotencyKey({ payload, jobId, timestamp: Date.now() });

    const job: MessageJob = {
      id: jobId,
      tenantId: payload.tenantId,
      type: payload.type,
      templateName: payload.templateName,
      language: payload.language,
      payload: payload.payload,
      recipients: payload.recipients,
      priority: payload.priority,
      scheduledAt: payload.scheduledAt,
      attempts: 0,
      status: "pending",
      idempotencyKey
    };

    if (config.queue.mode === "inline") {
      try {
        const results = await whatsappService.process(job);
        return res.status(200).json({ jobId, idempotencyKey, status: "processed", results });
      } catch (error) {
        const err = error as any;
        logger.error({ err, jobId }, "inline processing failed");
        const body = process.env.APP_ENV === "development" ? { error: "Failed to process job inline", details: err?.response?.data ?? err?.message } : { error: "Failed to process job inline" };
        return res.status(500).json(body);
      }
    }

    if (!sqsClient) {
      return res.status(500).json({ error: "Queue client not configured" });
    }

    const body = JSON.stringify(job);
    try {
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: config.queue.sendQueueUrl,
          MessageBody: body,
          MessageDeduplicationId: idempotencyKey,
          MessageGroupId: payload.tenantId
        })
      );
      return res.status(202).json({ jobId, idempotencyKey, status: "queued" });
    } catch {
      return res.status(500).json({ error: "Failed to enqueue job" });
    }
  });

  return router;
};



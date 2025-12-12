import express from "express";
import pinoHttp from "pino-http";
import path from "node:path";

import { loadConfig } from "./config/index.js";
import { createHealthRouter } from "./routes/health.js";
import { createMessageJobsRouter } from "./routes/messageJobs.js";
import { MessageQueueConsumer } from "./queues/messageQueueConsumer.js";
import { WhatsAppService } from "./services/whatsappService.js";
import { InMemoryConsentStore } from "./services/consentService.js";
import { TemplateRenderer } from "./services/templateRenderer.js";
import { FileTemplateProvider } from "./services/providers/fileTemplateProvider.js";
import { logger } from "./utils/logger.js";
import { createWhatsAppWebhookRouter } from "./webhooks/whatsappWebhook.js";
import { WhatsAppClient } from "./clients/whatsappClient.js";

const config = loadConfig();

const rootDir = process.cwd();
const templateDir = process.env.TEMPLATE_DIR ?? path.join(rootDir, "templates", "whatsapp_templates");
const staticDir = path.join(rootDir, "public");
const templateProvider = new FileTemplateProvider(templateDir);
const renderer = new TemplateRenderer(templateProvider);
const waClient = new WhatsAppClient(config);
const consentStore = new InMemoryConsentStore();
const whatsappService = new WhatsAppService({ client: waClient, renderer, consentStore });
const queueConsumer = config.queue.mode === "sqs" ? new MessageQueueConsumer({ config, whatsappService }) : null;

export const createApp = () => {
  const app = express();
  app.use(express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf.toString(); } }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: true
    })
  );

  if (process.env.ENABLE_FRONTEND !== "false") {
    app.use(express.static(staticDir));
  }

  app.use("/health", createHealthRouter());
  app.use("/api/v1/message-jobs", createMessageJobsRouter(config, { whatsappService }));
  app.use("/api/v1/whatsapp/webhook", createWhatsAppWebhookRouter(config));

  return app;
};

if (process.env.NODE_ENV !== "test") {
  const port = process.env.PORT ?? 4100;
  const app = createApp();
  app.listen(port, () => {
    logger.info({ port }, "whatsapp plugin API listening");
  });

  if (queueConsumer) {
    queueConsumer.start().catch((error) => {
      logger.error({ err: error as Error }, "queue consumer crashed");
      process.exitCode = 1;
    });
  } else {
    logger.info("Queue consumer disabled (QUEUE_MODE=inline)");
  }
}



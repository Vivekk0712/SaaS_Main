import { config as loadEnv } from "dotenv";
import { z } from "zod";

const queueSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("sqs"),
    sendQueueUrl: z.string().min(1, "SEND_QUEUE_URL is required"),
    retryQueueUrl: z.string().optional(),
    deadLetterQueueUrl: z.string().optional(),
    visibilityTimeout: z.coerce.number().min(5).max(600).default(30),
    maxNumberOfMessages: z.coerce.number().min(1).max(10).default(10),
    waitTimeSeconds: z.coerce.number().min(0).max(20).default(10)
  }),
  z.object({
    mode: z.literal("inline")
  })
]);

const whatsappSchema = z.object({
  region: z.string().default("ap-south-1"),
  phoneNumberId: z.string().optional(),
  testPhoneNumberId: z.string().optional(),
  accessToken: z.string().optional(),
  businessId: z.string().optional(),
  verifyToken: z.string().optional(),
  appSecret: z.string().optional()
});

const appSchema = z.object({
  environment: z.enum(["development", "staging", "production", "test"]).default("development"),
  queue: queueSchema,
  whatsapp: whatsappSchema,
  metricsEnabled: z
    .string()
    .optional()
    .transform((v) => (v ? !["false", "0", "no"].includes(v.toLowerCase()) : true)),
  metricsNamespace: z.string().default("school-erp-whatsapp"),
  templateDir: z.string().default("./templates/whatsapp_templates")
});

export type AppConfig = z.infer<typeof appSchema>;

export const loadConfig = (): AppConfig => {
  loadEnv();

  const queueMode =
    process.env.QUEUE_MODE && process.env.QUEUE_MODE.toLowerCase() === "inline"
      ? "inline"
      : "sqs";

  const queueConfig =
    queueMode === "sqs"
      ? {
          mode: "sqs" as const,
          sendQueueUrl: process.env.SEND_QUEUE_URL,
          retryQueueUrl: process.env.RETRY_QUEUE_URL,
          deadLetterQueueUrl: process.env.DLQ_QUEUE_URL,
          visibilityTimeout: process.env.QUEUE_VISIBILITY_TIMEOUT,
          maxNumberOfMessages: process.env.QUEUE_BATCH_SIZE,
          waitTimeSeconds: process.env.QUEUE_WAIT_TIME
        }
      : { mode: "inline" as const };

  return appSchema.parse({
    environment: process.env.APP_ENV,
    queue: queueConfig,
    whatsapp: {
      region: process.env.WHATSAPP_REGION,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      testPhoneNumberId: process.env.WHATSAPP_TEST_PHONE_NUMBER_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      businessId: process.env.WHATSAPP_BUSINESS_ID,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
      appSecret: process.env.WHATSAPP_APP_SECRET
    },
    metricsEnabled: process.env.ENABLE_METRICS,
    metricsNamespace: process.env.METRICS_NAMESPACE,
    templateDir: process.env.TEMPLATE_DIR
  });
};



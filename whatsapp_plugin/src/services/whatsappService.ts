import { chunk } from "../utils/chunk.js";
import { logger } from "../utils/logger.js";
import type { WhatsAppClient } from "../clients/whatsappClient.js";
import type { MessageJob, SendResult } from "../domain/types.js";
import type { ConsentStore } from "./consentService.js";
import type { TemplateRenderer } from "./templateRenderer.js";

export interface WhatsAppServiceDependencies {
  client: WhatsAppClient;
  renderer: TemplateRenderer;
  consentStore: ConsentStore;
}

export class WhatsAppService {
  private readonly client: WhatsAppClient;
  private readonly renderer: TemplateRenderer;
  private readonly consentStore: ConsentStore;
  private readonly batchSize: number;

  constructor({ client, renderer, consentStore }: WhatsAppServiceDependencies) {
    this.client = client;
    this.renderer = renderer;
    this.consentStore = consentStore;
    this.batchSize = 50;
  }

  async process(job: MessageJob): Promise<SendResult[]> {
    logger.info({ jobId: job.id, tenantId: job.tenantId }, "processing whatsapp message job");

    const allowed = [] as typeof job.recipients;
    const skipped: SendResult[] = [];

    for (const recipient of job.recipients) {
      const record = await this.consentStore.loadRecipient(job.tenantId, recipient.phone);
      const hasOptedOut = record ? (!record.consent || record.disabled) : false;
      if (hasOptedOut) {
        skipped.push({ recipient: recipient.phone, status: "skipped", error: "ConsentMissingOrDisabled" });
      } else {
        allowed.push(recipient);
      }
    }

    if (allowed.length === 0) {
      logger.warn({ jobId: job.id }, "no recipients allowed to receive whatsapp message");
      return skipped;
    }

    if (job.type === "bulk") {
      return [...skipped, ...(await this.sendBulk(job, allowed))];
    }
    if (job.type === "session_text") {
      return [...skipped, ...(await this.sendSessionText(job, allowed))];
    }
    return [...skipped, ...(await this.sendTransactional(job, allowed))];
  }

  private async sendTransactional(job: MessageJob, recipients: MessageJob["recipients"]): Promise<SendResult[]> {
    const rendered = await this.renderer.render(job.templateName, job.payload, job.language);
    try {
      const results: SendResult[] = [];
      for (const recipient of recipients) {
        const messageId = await this.client.sendTemplateMessage({
          to: recipient.phone,
          templateName: job.templateName,
          language: job.language,
          parameters: rendered.parameters
        });
        results.push({ recipient: recipient.phone, status: "sent", messageId });
      }
      return results;
    } catch (error) {
      const err = error as any;
      const axiosData = err?.response?.data;
      const axiosStatus = err?.response?.status;
      logger.error({ err, axiosStatus, axiosData, jobId: job.id }, "transactional send failed; rethrowing to trigger retry");
      throw error;
    }
  }

  private async sendBulk(job: MessageJob, recipients: MessageJob["recipients"]): Promise<SendResult[]> {
    const batches = chunk(recipients, this.batchSize);
    const aggregated: SendResult[] = [];
    for (const batch of batches) {
      try {
        for (const recipient of batch) {
          const rendered = await this.renderer.render(job.templateName, { ...job.payload, ...(recipient.substitutions ?? {}) }, job.language);
          const messageId = await this.client.sendTemplateMessage({
            to: recipient.phone,
            templateName: job.templateName,
            language: job.language,
            parameters: rendered.parameters
          });
          aggregated.push({ recipient: recipient.phone, status: "sent", messageId });
        }
      } catch (error) {
        const err = error as any;
        logger.error({ err, axiosStatus: err?.response?.status, axiosData: err?.response?.data, jobId: job.id }, "bulk send failed; will bubble up");
        throw error;
      }
    }
    return aggregated;
  }

  private async sendSessionText(job: MessageJob, recipients: MessageJob["recipients"]): Promise<SendResult[]> {
    // Render body from local template to build a text; requires 24h customer session
    const rendered = await this.renderer.render(job.templateName, job.payload, job.language);
    try {
      const results: SendResult[] = [];
      for (const recipient of recipients) {
        const messageId = await this.client.sendTextMessage(recipient.phone, rendered.textBody);
        results.push({ recipient: recipient.phone, status: "sent", messageId });
      }
      return results;
    } catch (error) {
      const err = error as any;
      logger.error({ err, axiosStatus: err?.response?.status, axiosData: err?.response?.data, jobId: job.id }, "session text send failed");
      throw error;
    }
  }
}



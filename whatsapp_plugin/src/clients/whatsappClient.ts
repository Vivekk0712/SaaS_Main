import axios from "axios";
import type { AppConfig } from "../config/index.js";

export interface SendTemplateInput {
  to: string; // E.164 phone
  templateName: string;
  language: string; // e.g., en_US
  parameters: Array<{ type: "text"; text: string }>;
}

export class WhatsAppClient {
  private readonly apiBase: string;
  private readonly phoneNumberId?: string;
  private readonly accessToken?: string;

  constructor(config: AppConfig) {
    this.phoneNumberId = config.whatsapp.phoneNumberId ?? config.whatsapp.testPhoneNumberId;
    this.accessToken = config.whatsapp.accessToken;
    this.apiBase = `https://graph.facebook.com/v20.0`;
  }

  async sendTemplateMessage(input: SendTemplateInput): Promise<string | undefined> {
    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error("WhatsApp credentials missing. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN");
    }

    const url = `${this.apiBase}/${this.phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to: input.to,
      type: "template",
      template: {
        name: input.templateName,
        language: { code: input.language },
        components: [
          {
            type: "body",
            parameters: input.parameters
          }
        ]
      }
    } as const;

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json"
      }
    });

    // Returns a message object with an id
    const id = response.data?.messages?.[0]?.id as string | undefined;
    return id;
  }

  async sendTextMessage(to: string, body: string): Promise<string | undefined> {
    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error("WhatsApp credentials missing. Set WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_TEST_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN");
    }
    const url = `${this.apiBase}/${this.phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body }
    } as const;

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json"
      }
    });

    return response.data?.messages?.[0]?.id as string | undefined;
  }
}



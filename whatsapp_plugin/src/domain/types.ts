export interface Recipient {
  phone: string; // E.164 phone number
  name?: string;
  substitutions?: Record<string, unknown>;
}

export type MessageType = "transactional" | "bulk" | "otp" | "session_text";

export interface MessageJob {
  id: string;
  tenantId: string;
  type: MessageType;
  templateName: string;
  language: string; // e.g., en_US
  payload: Record<string, unknown>;
  recipients: Recipient[];
  priority: "high" | "normal" | "low";
  scheduledAt?: string;
  attempts: number;
  status: "pending" | "sent" | "partial" | "failed";
  idempotencyKey: string;
}

export interface SendResult {
  recipient: string; // phone
  status: "sent" | "failed" | "skipped";
  messageId?: string;
  error?: string;
}



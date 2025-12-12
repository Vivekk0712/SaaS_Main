export interface RecipientConsentRecord {
  tenantId: string;
  phone: string;
  consent: boolean;
  disabled?: boolean;
}

export interface ConsentStore {
  loadRecipient(tenantId: string, phone: string): Promise<RecipientConsentRecord | null>;
  upsertRecipient(record: RecipientConsentRecord): Promise<void>;
}

export class InMemoryConsentStore implements ConsentStore {
  private readonly map = new Map<string, RecipientConsentRecord>();

  private key(tenantId: string, phone: string): string {
    return `${tenantId}:${phone}`;
  }

  async loadRecipient(tenantId: string, phone: string): Promise<RecipientConsentRecord | null> {
    return this.map.get(this.key(tenantId, phone)) ?? null;
  }

  async upsertRecipient(record: RecipientConsentRecord): Promise<void> {
    this.map.set(this.key(record.tenantId, record.phone), record);
  }
}



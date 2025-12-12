import crypto from "node:crypto";

export const createIdempotencyKey = (input: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");



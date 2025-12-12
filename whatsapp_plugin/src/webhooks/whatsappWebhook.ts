import crypto from "node:crypto";
import { Router } from "express";
import type { AppConfig } from "../config/index.js";

function verifySignature(appSecret: string | undefined, payload: string, signature: string | undefined): boolean {
  if (!appSecret || !signature) return true; // skip if not configured
  const sig = signature.replace("sha256=", "");
  const expected = crypto.createHmac("sha256", appSecret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export const createWhatsAppWebhookRouter = (config: AppConfig): Router => {
  const router = Router();

  // Verification endpoint
  router.get("/", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === config.whatsapp.verifyToken && challenge) {
      return res.status(200).send(String(challenge));
    }
    return res.sendStatus(403);
  });

  // Events endpoint
  router.post("/", (req, res) => {
    const raw = JSON.stringify(req.body);
    const signature = req.header("X-Hub-Signature-256") ?? req.header("x-hub-signature-256");
    if (!verifySignature(config.whatsapp.appSecret, raw, signature)) {
      return res.sendStatus(403);
    }
    // Minimal ack; extend to handle statuses and replies as needed
    return res.sendStatus(200);
  });

  return router;
};



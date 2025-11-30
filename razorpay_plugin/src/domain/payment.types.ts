import { z } from 'zod';

export const CreateOrderRequestSchema = z.object({
  invoiceId: z.union([z.number().positive(), z.string()]),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  idempotencyKey: z.string().optional(),
});

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export const VerifyPaymentRequestSchema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_order_id: z.string(),
  razorpay_signature: z.string(),
});

export type VerifyPaymentRequest = z.infer<typeof VerifyPaymentRequestSchema>;

export const RefundRequestSchema = z.object({
  paymentId: z.number().positive(),
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
});

export type RefundRequest = z.infer<typeof RefundRequestSchema>;

export interface PaymentAttempt {
  id?: number;
  invoice_id: number | string;
  attempt_reference: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  status: 'created' | 'pending' | 'completed' | 'failed' | 'captured';
  metadata: any;
  created_at?: Date;
  updated_at?: Date;
}

export interface Payment {
  id?: number;
  payment_attempt_id: number;
  razorpay_payment_id: string;
  method: string;
  status: 'authorized' | 'captured' | 'refunded' | 'failed';
  amount: number;
  fee_charged: number;
  response_json: any;
  captured_at?: Date;
  created_at?: Date;
}

export interface Refund {
  id?: number;
  payment_id: number;
  razorpay_refund_id: string;
  amount: number;
  status: 'processing' | 'successful' | 'failed';
  response_json: any;
  created_at?: Date;
  updated_at?: Date;
}

export interface WebhookEvent {
  id?: number;
  event_type: string;
  event_payload: any;
  received_at?: Date;
  processed: boolean;
  processing_log: string | null;
}

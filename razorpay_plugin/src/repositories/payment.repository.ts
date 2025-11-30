import { getDatabase } from '../config/database.js';
import { logger } from '../config/logger.js';
import type { PaymentAttempt, Payment, Refund, WebhookEvent } from '../domain/payment.types.js';

export class PaymentRepository {
  /**
   * Create payment attempt
   */
  async createPaymentAttempt(attempt: PaymentAttempt): Promise<number> {
    const db = getDatabase();
    
    try {
      const [result] = await db.execute(
        `INSERT INTO payment_attempts 
        (invoice_id, attempt_reference, razorpay_order_id, amount, currency, status, metadata) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          attempt.invoice_id,
          attempt.attempt_reference,
          attempt.razorpay_order_id,
          attempt.amount,
          attempt.currency,
          attempt.status,
          JSON.stringify(attempt.metadata),
        ]
      );

      const insertId = (result as any).insertId;
      logger.info({ attemptId: insertId, invoiceId: attempt.invoice_id }, 'Payment attempt created');
      return insertId;
    } catch (error) {
      logger.error({ error, attempt }, 'Failed to create payment attempt');
      throw error;
    }
  }

  /**
   * Update payment attempt
   */
  async updatePaymentAttempt(id: number, updates: Partial<PaymentAttempt>): Promise<void> {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.razorpay_payment_id !== undefined) {
      fields.push('razorpay_payment_id = ?');
      values.push(updates.razorpay_payment_id);
    }
    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.metadata) {
      fields.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }

    if (fields.length === 0) return;

    values.push(id);

    try {
      await db.execute(
        `UPDATE payment_attempts SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
        values
      );
      logger.info({ attemptId: id, updates }, 'Payment attempt updated');
    } catch (error) {
      logger.error({ error, id, updates }, 'Failed to update payment attempt');
      throw error;
    }
  }

  /**
   * Get payment attempt by order ID
   */
  async getPaymentAttemptByOrderId(orderId: string): Promise<PaymentAttempt | null> {
    const db = getDatabase();
    
    try {
      const [rows] = await db.execute(
        'SELECT * FROM payment_attempts WHERE razorpay_order_id = ?',
        [orderId]
      );
      
      const attempts = rows as PaymentAttempt[];
      return attempts.length > 0 ? attempts[0] : null;
    } catch (error) {
      logger.error({ error, orderId }, 'Failed to get payment attempt');
      throw error;
    }
  }

  /**
   * Create payment record
   */
  async createPayment(payment: Payment): Promise<number> {
    const db = getDatabase();
    
    try {
      const [result] = await db.execute(
        `INSERT INTO razorpay_payments 
        (payment_attempt_id, razorpay_payment_id, method, status, amount, fee_charged, response_json, captured_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payment.payment_attempt_id,
          payment.razorpay_payment_id,
          payment.method,
          payment.status,
          payment.amount,
          payment.fee_charged,
          JSON.stringify(payment.response_json),
          payment.captured_at || null,
        ]
      );

      const insertId = (result as any).insertId;
      logger.info({ paymentId: insertId, razorpay_payment_id: payment.razorpay_payment_id }, 'Payment created');
      return insertId;
    } catch (error) {
      logger.error({ error, payment }, 'Failed to create payment');
      throw error;
    }
  }

  /**
   * Get payment by Razorpay payment ID
   */
  async getPaymentByRazorpayId(razorpayPaymentId: string): Promise<Payment | null> {
    const db = getDatabase();
    
    try {
      const [rows] = await db.execute(
        'SELECT * FROM razorpay_payments WHERE razorpay_payment_id = ?',
        [razorpayPaymentId]
      );
      
      const payments = rows as Payment[];
      return payments.length > 0 ? payments[0] : null;
    } catch (error) {
      logger.error({ error, razorpayPaymentId }, 'Failed to get payment');
      throw error;
    }
  }

  /**
   * Create refund record
   */
  async createRefund(refund: Refund): Promise<number> {
    const db = getDatabase();
    
    try {
      const [result] = await db.execute(
        `INSERT INTO refunds 
        (payment_id, razorpay_refund_id, amount, status, response_json) 
        VALUES (?, ?, ?, ?, ?)`,
        [
          refund.payment_id,
          refund.razorpay_refund_id,
          refund.amount,
          refund.status,
          JSON.stringify(refund.response_json),
        ]
      );

      const insertId = (result as any).insertId;
      logger.info({ refundId: insertId, razorpay_refund_id: refund.razorpay_refund_id }, 'Refund created');
      return insertId;
    } catch (error) {
      logger.error({ error, refund }, 'Failed to create refund');
      throw error;
    }
  }

  /**
   * Update refund status
   */
  async updateRefundStatus(razorpayRefundId: string, status: string): Promise<void> {
    const db = getDatabase();
    
    try {
      await db.execute(
        'UPDATE refunds SET status = ?, updated_at = NOW() WHERE razorpay_refund_id = ?',
        [status, razorpayRefundId]
      );
      logger.info({ razorpayRefundId, status }, 'Refund status updated');
    } catch (error) {
      logger.error({ error, razorpayRefundId, status }, 'Failed to update refund status');
      throw error;
    }
  }

  /**
   * Store webhook event
   */
  async storeWebhookEvent(event: WebhookEvent): Promise<number> {
    const db = getDatabase();
    
    try {
      const [result] = await db.execute(
        `INSERT INTO webhook_events 
        (event_type, event_payload, processed, processing_log) 
        VALUES (?, ?, ?, ?)`,
        [
          event.event_type,
          JSON.stringify(event.event_payload),
          event.processed,
          event.processing_log,
        ]
      );

      const insertId = (result as any).insertId;
      logger.info({ eventId: insertId, eventType: event.event_type }, 'Webhook event stored');
      return insertId;
    } catch (error) {
      logger.error({ error, event }, 'Failed to store webhook event');
      throw error;
    }
  }

  /**
   * Check if webhook event already processed
   */
  async isWebhookProcessed(eventId: string): Promise<boolean> {
    const db = getDatabase();
    
    try {
      const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM webhook_events WHERE JSON_EXTRACT(event_payload, "$.id") = ? AND processed = TRUE',
        [eventId]
      );
      
      const result = rows as any[];
      return result[0].count > 0;
    } catch (error) {
      logger.error({ error, eventId }, 'Failed to check webhook processed status');
      throw error;
    }
  }
}

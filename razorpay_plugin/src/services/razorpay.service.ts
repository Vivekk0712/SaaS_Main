import Razorpay from 'razorpay';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { CreateOrderRequest, VerifyPaymentRequest, RefundRequest } from '../domain/payment.types.js';

export class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }

  /**
   * Create a Razorpay order
   */
  async createOrder(request: CreateOrderRequest) {
    // Razorpay receipt max length is 40 characters
    // Generate a short unique receipt
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const receipt = `rcpt_${timestamp}`;
    
    try {
      const order = await this.razorpay.orders.create({
        amount: Math.round(request.amount * 100), // Convert to paise
        currency: request.currency,
        receipt,
        notes: {
          invoice_id: request.invoiceId.toString(),
        },
      });

      logger.info({ orderId: order.id, invoiceId: request.invoiceId }, 'Order created successfully');
      
      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      };
    } catch (error) {
      logger.error({ error, invoiceId: request.invoiceId }, 'Failed to create order');
      throw error;
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(data: VerifyPaymentRequest): boolean {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
    
    const generated_signature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = generated_signature === razorpay_signature;
    
    logger.info({ 
      razorpay_payment_id, 
      razorpay_order_id, 
      isValid 
    }, 'Payment signature verification');

    return isValid;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expected_signature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return expected_signature === signature;
  }

  /**
   * Fetch payment details
   */
  async fetchPayment(paymentId: string) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      logger.info({ paymentId, status: payment.status }, 'Payment fetched');
      return payment;
    } catch (error) {
      logger.error({ error, paymentId }, 'Failed to fetch payment');
      throw error;
    }
  }

  /**
   * Capture payment (if not auto-captured)
   */
  async capturePayment(paymentId: string, amount: number) {
    try {
      const payment = await this.razorpay.payments.capture(paymentId, amount, 'INR');
      logger.info({ paymentId, amount }, 'Payment captured');
      return payment;
    } catch (error) {
      logger.error({ error, paymentId }, 'Failed to capture payment');
      throw error;
    }
  }

  /**
   * Create refund
   */
  async createRefund(request: RefundRequest & { razorpay_payment_id: string }) {
    try {
      const refundData: any = {
        payment_id: request.razorpay_payment_id,
      };

      if (request.amount) {
        refundData.amount = Math.round(request.amount * 100); // Convert to paise
      }

      if (request.reason) {
        refundData.notes = { reason: request.reason };
      }

      const refund = await this.razorpay.refunds.create(refundData);
      
      logger.info({ 
        refundId: refund.id, 
        paymentId: request.razorpay_payment_id,
        amount: refund.amount 
      }, 'Refund created');

      return refund;
    } catch (error) {
      logger.error({ error, paymentId: request.razorpay_payment_id }, 'Failed to create refund');
      throw error;
    }
  }

  /**
   * Fetch refund details
   */
  async fetchRefund(refundId: string) {
    try {
      const refund = await this.razorpay.refunds.fetch(refundId);
      logger.info({ refundId, status: refund.status }, 'Refund fetched');
      return refund;
    } catch (error) {
      logger.error({ error, refundId }, 'Failed to fetch refund');
      throw error;
    }
  }

  /**
   * Get Razorpay key ID for frontend
   */
  getKeyId(): string {
    return env.RAZORPAY_KEY_ID;
  }
}

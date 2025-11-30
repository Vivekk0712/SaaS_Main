import { Router } from 'express';
import type { Request, Response } from 'express';
import { RazorpayService } from '../services/razorpay.service.js';
import { PaymentRepository } from '../repositories/payment.repository.js';
import { logger } from '../config/logger.js';

const router = Router();
const razorpayService = new RazorpayService();
const paymentRepo = new PaymentRepository();

/**
 * POST /api/webhooks/razorpay
 * Handle Razorpay webhook events
 */
router.post('/razorpay', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(payload, signature);
    
    if (!isValid) {
      logger.warn('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const eventId = event.event;

    // Check if event already processed (idempotency)
    const alreadyProcessed = await paymentRepo.isWebhookProcessed(event.payload?.payment?.entity?.id || event.payload?.refund?.entity?.id);
    
    if (alreadyProcessed) {
      logger.info({ eventId }, 'Webhook event already processed');
      return res.status(200).json({ status: 'already_processed' });
    }

    // Store webhook event
    await paymentRepo.storeWebhookEvent({
      event_type: event.event,
      event_payload: event,
      processed: false,
      processing_log: null,
    });

    // Process different event types
    try {
      await processWebhookEvent(event);
      
      // Mark as processed
      await paymentRepo.storeWebhookEvent({
        event_type: event.event,
        event_payload: event,
        processed: true,
        processing_log: 'Successfully processed',
      });

      logger.info({ eventType: event.event }, 'Webhook processed successfully');
      res.status(200).json({ status: 'ok' });
    } catch (processingError: any) {
      logger.error({ error: processingError.message, event }, 'Webhook processing failed');
      
      // Store error log
      await paymentRepo.storeWebhookEvent({
        event_type: event.event,
        event_payload: event,
        processed: false,
        processing_log: processingError.message,
      });

      // Still return 200 to prevent Razorpay from retrying immediately
      res.status(200).json({ status: 'error', message: processingError.message });
    }
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Webhook handler error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Process webhook event based on type
 */
async function processWebhookEvent(event: any): Promise<void> {
  const eventType = event.event;
  const entity = event.payload?.payment?.entity || event.payload?.refund?.entity;

  if (!entity) {
    throw new Error('Invalid webhook payload');
  }

  switch (eventType) {
    case 'payment.captured':
      await handlePaymentCaptured(entity);
      break;
    
    case 'payment.failed':
      await handlePaymentFailed(entity);
      break;
    
    case 'refund.processed':
      await handleRefundProcessed(entity);
      break;
    
    case 'refund.failed':
      await handleRefundFailed(entity);
      break;
    
    default:
      logger.info({ eventType }, 'Unhandled webhook event type');
  }
}

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(payment: any): Promise<void> {
  const attempt = await paymentRepo.getPaymentAttemptByOrderId(payment.order_id);
  
  if (!attempt) {
    logger.warn({ orderId: payment.order_id }, 'Payment attempt not found for captured payment');
    return;
  }

  // Update payment attempt status
  await paymentRepo.updatePaymentAttempt(attempt.id!, {
    status: 'captured',
    razorpay_payment_id: payment.id,
  });

  // Check if payment record exists
  const existingPayment = await paymentRepo.getPaymentByRazorpayId(payment.id);
  
  if (!existingPayment) {
    // Create payment record
    await paymentRepo.createPayment({
      payment_attempt_id: attempt.id!,
      razorpay_payment_id: payment.id,
      method: payment.method,
      status: 'captured',
      amount: payment.amount / 100,
      fee_charged: payment.fee ? payment.fee / 100 : 0,
      response_json: payment,
      captured_at: new Date(),
    });
  }

  logger.info({ paymentId: payment.id }, 'Payment captured event processed');
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payment: any): Promise<void> {
  const attempt = await paymentRepo.getPaymentAttemptByOrderId(payment.order_id);
  
  if (attempt) {
    await paymentRepo.updatePaymentAttempt(attempt.id!, {
      status: 'failed',
      razorpay_payment_id: payment.id,
    });
  }

  logger.info({ paymentId: payment.id }, 'Payment failed event processed');
}

/**
 * Handle refund.processed event
 */
async function handleRefundProcessed(refund: any): Promise<void> {
  await paymentRepo.updateRefundStatus(refund.id, 'successful');
  logger.info({ refundId: refund.id }, 'Refund processed event handled');
}

/**
 * Handle refund.failed event
 */
async function handleRefundFailed(refund: any): Promise<void> {
  await paymentRepo.updateRefundStatus(refund.id, 'failed');
  logger.info({ refundId: refund.id }, 'Refund failed event handled');
}

export default router;

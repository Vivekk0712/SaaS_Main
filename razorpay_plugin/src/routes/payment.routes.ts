import { Router } from 'express';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RazorpayService } from '../services/razorpay.service.js';
import { PaymentRepository } from '../repositories/payment.repository.js';
import { 
  CreateOrderRequestSchema, 
  VerifyPaymentRequestSchema,
  RefundRequestSchema 
} from '../domain/payment.types.js';
import { logger } from '../config/logger.js';

const router = Router();
const razorpayService = new RazorpayService();
const paymentRepo = new PaymentRepository();

/**
 * POST /api/payments/create-order
 * Create a Razorpay order
 */
router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const validatedRequest = CreateOrderRequestSchema.parse(req.body);
    const attemptReference = validatedRequest.idempotencyKey || `ATT_${uuidv4()}`;

    // Create order with Razorpay
    const order = await razorpayService.createOrder(validatedRequest);

    // Store payment attempt in database
    const attemptId = await paymentRepo.createPaymentAttempt({
      invoice_id: validatedRequest.invoiceId,
      attempt_reference: attemptReference,
      razorpay_order_id: order.orderId,
      razorpay_payment_id: null,
      amount: validatedRequest.amount,
      currency: validatedRequest.currency,
      status: 'created',
      metadata: { order },
    });

    res.json({
      success: true,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      key: razorpayService.getKeyId(),
      attemptId,
    });
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to create order');
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create order',
    });
  }
});

/**
 * POST /api/payments/verify
 * Verify payment signature and update database
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const validatedRequest = VerifyPaymentRequestSchema.parse(req.body);

    // Verify signature
    const isValid = razorpayService.verifyPaymentSignature(validatedRequest);
    
    if (!isValid) {
      logger.warn({ razorpay_payment_id: validatedRequest.razorpay_payment_id }, 'Invalid payment signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature',
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpayService.fetchPayment(validatedRequest.razorpay_payment_id);

    // Get payment attempt
    const attempt = await paymentRepo.getPaymentAttemptByOrderId(validatedRequest.razorpay_order_id);
    
    if (!attempt) {
      logger.error({ razorpay_order_id: validatedRequest.razorpay_order_id }, 'Payment attempt not found');
      return res.status(404).json({
        success: false,
        message: 'Payment attempt not found',
      });
    }

    // Update payment attempt
    await paymentRepo.updatePaymentAttempt(attempt.id!, {
      razorpay_payment_id: validatedRequest.razorpay_payment_id,
      status: payment.status === 'captured' ? 'captured' : 'completed',
      metadata: { ...attempt.metadata, payment },
    });

    // Create payment record
    await paymentRepo.createPayment({
      payment_attempt_id: attempt.id!,
      razorpay_payment_id: validatedRequest.razorpay_payment_id,
      method: payment.method,
      status: payment.status as any,
      amount: payment.amount / 100, // Convert from paise
      fee_charged: payment.fee ? payment.fee / 100 : 0,
      response_json: payment,
      captured_at: payment.status === 'captured' ? new Date() : undefined,
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        id: validatedRequest.razorpay_payment_id,
        status: payment.status,
        amount: payment.amount / 100,
        method: payment.method,
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Payment verification failed');
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Payment verification failed',
    });
  }
});

/**
 * POST /api/payments/refund
 * Initiate a refund
 */
router.post('/refund', async (req: Request, res: Response) => {
  try {
    const validatedRequest = RefundRequestSchema.parse(req.body);

    // Get payment from database
    const payment = await paymentRepo.getPaymentByRazorpayId(
      req.body.razorpay_payment_id || ''
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Create refund with Razorpay
    const refund = await razorpayService.createRefund({
      ...validatedRequest,
      razorpay_payment_id: payment.razorpay_payment_id,
    });

    // Store refund in database
    await paymentRepo.createRefund({
      payment_id: payment.id!,
      razorpay_refund_id: refund.id,
      amount: refund.amount / 100, // Convert from paise
      status: 'processing',
      response_json: refund,
    });

    res.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Refund creation failed');
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Refund creation failed',
    });
  }
});

/**
 * GET /api/payments/:paymentId
 * Get payment details
 */
router.get('/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const payment = await razorpayService.fetchPayment(paymentId);

    res.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        created_at: payment.created_at,
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message, paymentId: req.params.paymentId }, 'Failed to fetch payment');
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch payment',
    });
  }
});

export default router;

import { NextResponse } from 'next/server'

const RAZORPAY_PLUGIN_URL = process.env.RAZORPAY_PLUGIN_URL || 'http://localhost:5002'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body
    
    // Call the Razorpay plugin service to verify payment
    const response = await fetch(`${RAZORPAY_PLUGIN_URL}/api/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Payment verification failed:', errorData)
      throw new Error('Payment verification failed')
    }
    
    const result = await response.json()
    
    // Log successful payment for audit
    console.log('Payment verified successfully:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Payment verification failed' },
      { status: 400 }
    )
  }
}

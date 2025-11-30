import { NextResponse } from 'next/server'

const RAZORPAY_PLUGIN_URL = process.env.RAZORPAY_PLUGIN_URL || 'http://localhost:5002'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { amount, currency, invoiceId, idempotencyKey } = body
    
    // Call the Razorpay plugin service
    const response = await fetch(`${RAZORPAY_PLUGIN_URL}/api/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Number(amount),
        currency: currency || 'INR',
        invoiceId: invoiceId || `INV_${Date.now()}`,
        idempotencyKey: idempotencyKey || `KEY_${Date.now()}`
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Razorpay plugin error:', errorData)
      throw new Error('Failed to create order with Razorpay plugin')
    }
    
    const order = await response.json()
    return NextResponse.json(order)
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create order' },
      { status: 500 }
    )
  }
}

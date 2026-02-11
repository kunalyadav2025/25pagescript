import axios from 'axios';
import crypto from 'crypto';

// Cashfree configuration
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const CASHFREE_API_VERSION = '2023-08-01';
const IS_PRODUCTION = process.env.STAGE === 'prod';

const CASHFREE_BASE_URL = IS_PRODUCTION
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

// Payment amount in paise (INR 99 = 9900 paise)
export const UPLOAD_FEE_PAISE = 9900;
export const UPLOAD_FEE_RUPEES = 99;

interface CreateOrderResponse {
  orderId: string;
  orderToken: string;
  paymentSessionId: string;
  paymentLink: string;
}

/**
 * Create a Cashfree payment order
 */
export async function createPaymentOrder(params: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  returnUrl: string;
  notifyUrl: string;
}): Promise<CreateOrderResponse> {
  const { orderId, customerName, customerPhone, customerEmail, returnUrl, notifyUrl } = params;

  const requestBody = {
    order_id: orderId,
    order_amount: UPLOAD_FEE_RUPEES,
    order_currency: 'INR',
    customer_details: {
      customer_id: customerPhone.replace(/[^0-9]/g, ''),
      customer_name: customerName,
      customer_phone: customerPhone.replace(/[^0-9]/g, ''),
      customer_email: customerEmail || `${customerPhone.replace(/[^0-9]/g, '')}@noemail.com`,
    },
    order_meta: {
      return_url: returnUrl,
      notify_url: notifyUrl,
    },
    order_note: '25PageScript Upload Fee',
  };

  try {
    const response = await axios.post(
      `${CASHFREE_BASE_URL}/orders`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': CASHFREE_API_VERSION,
        },
      }
    );

    const data = response.data;

    return {
      orderId: data.order_id,
      orderToken: data.order_token || '',
      paymentSessionId: data.payment_session_id,
      paymentLink: data.payment_link || `${CASHFREE_BASE_URL}/orders/sessions/${data.payment_session_id}`,
    };
  } catch (error: any) {
    console.error('Cashfree create order error:', error.response?.data || error.message);
    throw new Error('Failed to create payment order');
  }
}

/**
 * Get payment order status
 */
export async function getOrderStatus(orderId: string): Promise<{
  status: 'PAID' | 'PENDING' | 'FAILED';
  paymentId?: string;
}> {
  try {
    const response = await axios.get(
      `${CASHFREE_BASE_URL}/orders/${orderId}`,
      {
        headers: {
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': CASHFREE_API_VERSION,
        },
      }
    );

    const data = response.data;

    let status: 'PAID' | 'PENDING' | 'FAILED';
    switch (data.order_status) {
      case 'PAID':
        status = 'PAID';
        break;
      case 'ACTIVE':
      case 'PENDING':
        status = 'PENDING';
        break;
      default:
        status = 'FAILED';
    }

    return {
      status,
      paymentId: data.cf_order_id,
    };
  } catch (error: any) {
    console.error('Cashfree get order status error:', error.response?.data || error.message);
    throw new Error('Failed to get payment status');
  }
}

/**
 * Get payments for an order
 */
export async function getOrderPayments(orderId: string): Promise<any[]> {
  try {
    const response = await axios.get(
      `${CASHFREE_BASE_URL}/orders/${orderId}/payments`,
      {
        headers: {
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': CASHFREE_API_VERSION,
        },
      }
    );

    return response.data || [];
  } catch (error: any) {
    console.error('Cashfree get payments error:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Verify Cashfree webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  timestamp: string,
  signature: string
): boolean {
  const signatureData = timestamp + body;
  const expectedSignature = crypto
    .createHmac('sha256', CASHFREE_SECRET_KEY)
    .update(signatureData)
    .digest('base64');

  return signature === expectedSignature;
}

/**
 * Parse webhook payload
 */
export interface WebhookPayload {
  type: string;
  data: {
    order: {
      order_id: string;
      order_amount: number;
      order_currency: string;
      order_status: string;
    };
    payment: {
      cf_payment_id: number;
      payment_status: string;
      payment_amount: number;
      payment_currency: string;
      payment_time: string;
      payment_method: {
        [key: string]: any;
      };
    };
  };
}

export function parseWebhookPayload(body: string): WebhookPayload {
  return JSON.parse(body);
}

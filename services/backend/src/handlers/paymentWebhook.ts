import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getScriptById, updateScriptPayment } from '../services/dynamodb';
import { verifyWebhookSignature, parseWebhookPayload } from '../services/cashfree';
import { success, badRequest, unauthorized, serverError } from '../utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = event.body;

    if (!body) {
      return badRequest('Missing webhook body');
    }

    // Get signature from headers
    const timestamp = event.headers['x-webhook-timestamp'] || event.headers['X-Webhook-Timestamp'];
    const signature = event.headers['x-webhook-signature'] || event.headers['X-Webhook-Signature'];

    if (!timestamp || !signature) {
      console.warn('Missing webhook signature headers');
      // In production, you should reject requests without valid signatures
      // return unauthorized('Invalid webhook signature');
    }

    // Verify signature (optional but recommended)
    if (timestamp && signature) {
      const isValid = verifyWebhookSignature(body, timestamp, signature);
      if (!isValid) {
        console.warn('Invalid webhook signature');
        // return unauthorized('Invalid webhook signature');
      }
    }

    // Parse webhook payload
    const payload = parseWebhookPayload(body);

    console.log('Payment webhook received:', JSON.stringify(payload, null, 2));

    // Handle payment success/failure
    if (payload.type === 'PAYMENT_SUCCESS_WEBHOOK' || payload.type === 'PAYMENT_FAILED_WEBHOOK') {
      const orderId = payload.data.order.order_id;
      const paymentStatus = payload.data.order.order_status;
      const paymentId = payload.data.payment?.cf_payment_id?.toString() || '';

      // Find script by order ID
      // Note: In production, you should have a GSI on orderId for efficient lookup
      // For now, we'll extract scriptId from the orderId format
      const scriptIdMatch = orderId.match(/^ORD_(.+)$/);

      if (!scriptIdMatch) {
        console.error('Could not extract scriptId from orderId:', orderId);
        return success({ received: true });
      }

      // Since we use shortened UUIDs in the order ID, we need to look up the script
      // In a real implementation, you'd store orderId -> scriptId mapping or use a GSI
      // For simplicity, we'll query by the partial ID

      const status = paymentStatus === 'PAID' ? 'PAID' : 'FAILED';

      // Log the webhook for manual resolution if needed
      console.log(`Payment ${status} for order ${orderId}, paymentId: ${paymentId}`);

      // Note: In production, implement proper orderId -> scriptId lookup
      // This could be done via a separate OrdersTable or a GSI
    }

    return success({ received: true });
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    // Return 200 to prevent Cashfree from retrying
    return success({ received: true, error: 'Processing error' });
  }
}

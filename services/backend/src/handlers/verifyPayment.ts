import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getScriptById, updateScriptPayment } from '../services/dynamodb';
import { getOrderStatus } from '../services/cashfree';
import { success, badRequest, notFound, serverError, parseBody } from '../utils/response';
import { VerifyPaymentRequest } from '../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = parseBody<VerifyPaymentRequest>(event.body);

    if (!body || !body.scriptId) {
      return badRequest('Script ID is required');
    }

    const { scriptId, cashfreePaymentId } = body;

    // Get script
    const script = await getScriptById(scriptId);

    if (!script) {
      return notFound('Script not found');
    }

    // Already published
    if (script.status === 'PUBLISHED') {
      return success({
        success: true,
        message: 'Script is already published',
        script,
      });
    }

    // Get order status from Cashfree
    const orderId = script.payment.orderId;
    const orderStatus = await getOrderStatus(orderId);

    if (orderStatus.status === 'PAID') {
      // Update script status
      const updatedScript = await updateScriptPayment(
        scriptId,
        orderStatus.paymentId || cashfreePaymentId || '',
        'PAID'
      );

      return success({
        success: true,
        message: 'Payment verified. Script published!',
        script: updatedScript,
      });
    } else if (orderStatus.status === 'PENDING') {
      return success({
        success: false,
        message: 'Payment is still pending',
        status: 'PENDING',
      });
    } else {
      // Payment failed
      await updateScriptPayment(scriptId, '', 'FAILED');

      return success({
        success: false,
        message: 'Payment failed. Please try again.',
        status: 'FAILED',
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return serverError('Failed to verify payment');
  }
}

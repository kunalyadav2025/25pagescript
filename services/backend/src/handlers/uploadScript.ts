import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { createScript } from '../services/dynamodb';
import { uploadPDF } from '../services/s3';
import { verifyVerificationToken } from '../services/sms';
import { createPaymentOrder, UPLOAD_FEE_PAISE } from '../services/cashfree';
import { success, badRequest, unauthorized, serverError, parseBody } from '../utils/response';
import { UploadScriptRequest, GENRES } from '../types';

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.25pagescript.com';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = parseBody<UploadScriptRequest>(event.body);

    if (!body) {
      return badRequest('Invalid request body');
    }

    const {
      verificationToken,
      writerName,
      writerMobile,
      title,
      logline,
      synopsis,
      genre,
      language,
      hasCopyright,
      copyrightNumber,
      scriptFileBase64,
      scriptFileName,
      pageCount,
    } = body;

    // Validate required fields
    if (!verificationToken || !writerName || !writerMobile || !title || !logline || !synopsis || !genre || !scriptFileBase64) {
      return badRequest('Missing required fields');
    }

    // Verify the verification token
    if (!verifyVerificationToken(verificationToken, writerMobile)) {
      return unauthorized('Invalid or expired verification token. Please verify your mobile number again.');
    }

    // Validate genre
    if (!GENRES.includes(genre)) {
      return badRequest(`Invalid genre. Must be one of: ${GENRES.join(', ')}`);
    }

    // Validate logline length
    if (logline.length > 200) {
      return badRequest('Logline must be 200 characters or less');
    }

    // Validate page count
    if (pageCount > 25) {
      return badRequest('Script must be 25 pages or less');
    }

    // Validate copyright number if applicable
    if (hasCopyright && !copyrightNumber) {
      return badRequest('Copyright certificate number is required when copyright is selected');
    }

    // Generate unique IDs
    const scriptId = uuidv4();
    const orderId = `ORD_${scriptId.replace(/-/g, '').substring(0, 20)}`;

    // Upload PDF to S3
    const fileBuffer = Buffer.from(scriptFileBase64, 'base64');
    const s3Key = await uploadPDF(scriptId, scriptFileName, fileBuffer);

    // TODO: Re-enable Cashfree payment when ready
    // const paymentOrder = await createPaymentOrder({
    //   orderId,
    //   customerName: writerName,
    //   customerPhone: writerMobile,
    //   returnUrl: `${API_BASE_URL}/payments/return?orderId=${orderId}&scriptId=${scriptId}`,
    //   notifyUrl: `${API_BASE_URL}/payments/webhook`,
    // });

    // Create script record (published directly - payment bypassed)
    const script = await createScript({
      title: title.trim(),
      logline: logline.trim(),
      synopsis: synopsis.trim(),
      genre,
      language: language || 'Hindi',
      pageCount,
      scriptFileS3Key: s3Key,
      copyright: {
        hasCertificate: hasCopyright,
        certificateNumber: hasCopyright ? copyrightNumber : undefined,
      },
      writer: {
        name: writerName.trim(),
        mobile: writerMobile,
        mobileVerified: true,
      },
      payment: {
        orderId,
        paymentId: 'free-upload',
        amount: 0,
        status: 'PAID',
      },
      status: 'PUBLISHED',
      likeCount: 0,
      dislikeCount: 0,
      commentCount: 0,
    });

    return success({
      scriptId: script.scriptId,
      // TODO: Re-enable when Cashfree is active
      // paymentOrderId: orderId,
      // paymentSessionId: paymentOrder.paymentSessionId,
      // paymentLink: paymentOrder.paymentLink,
    });
  } catch (error) {
    console.error('Error uploading script:', error);
    return serverError('Failed to upload script');
  }
}

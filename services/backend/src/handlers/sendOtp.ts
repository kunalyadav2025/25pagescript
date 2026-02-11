import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createOTP } from '../services/dynamodb';
import { generateOTP, hashOTP, sendOTP } from '../services/sms';
import { success, badRequest, serverError, parseBody } from '../utils/response';
import { SendOTPRequest } from '../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = parseBody<SendOTPRequest>(event.body);

    if (!body || !body.mobile) {
      return badRequest('Mobile number is required');
    }

    const { mobile } = body;

    // Validate Indian mobile number format
    const cleanMobile = mobile.replace(/\s/g, '');
    const mobileRegex = /^(\+91)?[6-9]\d{9}$/;

    if (!mobileRegex.test(cleanMobile)) {
      return badRequest('Invalid Indian mobile number');
    }

    // Normalize to +91 format
    const normalizedMobile = cleanMobile.startsWith('+91')
      ? cleanMobile
      : `+91${cleanMobile}`;

    // Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    // Store OTP record
    const otpRecord = await createOTP(normalizedMobile, otpHash);

    // Send OTP via SMS
    await sendOTP(normalizedMobile, otp);

    return success({
      otpId: otpRecord.otpId,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return serverError('Failed to send OTP. Please try again.');
  }
}

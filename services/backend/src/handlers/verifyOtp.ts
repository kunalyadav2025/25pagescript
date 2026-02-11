import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getOTP, incrementOTPAttempts, markOTPVerified } from '../services/dynamodb';
import { verifyOTPHash, generateVerificationToken } from '../services/sms';
import { success, badRequest, unauthorized, serverError, parseBody } from '../utils/response';
import { VerifyOTPRequest } from '../types';

const MAX_ATTEMPTS = 3;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = parseBody<VerifyOTPRequest>(event.body);

    if (!body || !body.otpId || !body.otp) {
      return badRequest('OTP ID and OTP are required');
    }

    const { otpId, otp } = body;

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return badRequest('OTP must be 6 digits');
    }

    // Get OTP record
    const otpRecord = await getOTP(otpId);

    if (!otpRecord) {
      return unauthorized('Invalid or expired OTP');
    }

    // Check if already verified
    if (otpRecord.verified) {
      return badRequest('OTP has already been used');
    }

    // Check if expired (TTL check)
    const now = Math.floor(Date.now() / 1000);
    if (now > otpRecord.expiresAt) {
      return unauthorized('OTP has expired. Please request a new one.');
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return unauthorized('Too many failed attempts. Please request a new OTP.');
    }

    // Verify OTP
    const isValid = verifyOTPHash(otp, otpRecord.otpHash);

    if (!isValid) {
      // Increment failed attempts
      await incrementOTPAttempts(otpId);
      const remainingAttempts = MAX_ATTEMPTS - otpRecord.attempts - 1;

      if (remainingAttempts > 0) {
        return unauthorized(`Invalid OTP. ${remainingAttempts} attempt(s) remaining.`);
      } else {
        return unauthorized('Too many failed attempts. Please request a new OTP.');
      }
    }

    // Mark OTP as verified
    await markOTPVerified(otpId);

    // Generate verification token for upload
    const verificationToken = generateVerificationToken(otpRecord.mobile);

    return success({
      verified: true,
      verificationToken,
      mobile: otpRecord.mobile,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return serverError('Failed to verify OTP');
  }
}

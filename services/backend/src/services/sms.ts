import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import axios from 'axios';
import crypto from 'crypto';

const snsClient = new SNSClient({});

// SMS Provider configuration
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'AWS_SNS'; // 'AWS_SNS' or 'MSG91'
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || '';
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'PGSCPT';
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || '';

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP for secure storage
 */
export function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Verify OTP hash
 */
export function verifyOTPHash(otp: string, hash: string): boolean {
  return hashOTP(otp) === hash;
}

/**
 * Send OTP via SMS
 */
export async function sendOTP(mobile: string, otp: string): Promise<boolean> {
  const message = `Your 25PageScript verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;

  try {
    if (SMS_PROVIDER === 'MSG91') {
      return await sendViaMSG91(mobile, otp);
    } else {
      return await sendViaSNS(mobile, message);
    }
  } catch (error) {
    console.error('Failed to send OTP:', error);
    throw new Error('Failed to send OTP. Please try again.');
  }
}

/**
 * Send SMS via AWS SNS
 */
async function sendViaSNS(mobile: string, message: string): Promise<boolean> {
  // Ensure mobile is in E.164 format
  const phoneNumber = mobile.startsWith('+') ? mobile : `+${mobile}`;

  await snsClient.send(
    new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    })
  );

  return true;
}

/**
 * Send SMS via MSG91
 */
async function sendViaMSG91(mobile: string, otp: string): Promise<boolean> {
  // Remove + prefix if present
  const phoneNumber = mobile.replace(/^\+/, '');

  const response = await axios.post(
    'https://api.msg91.com/api/v5/otp',
    {
      template_id: MSG91_TEMPLATE_ID,
      mobile: phoneNumber,
      authkey: MSG91_AUTH_KEY,
      otp: otp,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (response.data.type === 'success') {
    return true;
  }

  throw new Error(response.data.message || 'Failed to send OTP via MSG91');
}

/**
 * Generate a verification token after successful OTP verification
 */
export function generateVerificationToken(mobile: string): string {
  const timestamp = Date.now();
  const data = `${mobile}:${timestamp}`;
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(`${data}:${signature}`).toString('base64');
}

/**
 * Verify a verification token
 */
export function verifyVerificationToken(token: string, mobile: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [tokenMobile, timestamp, signature] = decoded.split(':');

    // Check if mobile matches
    if (tokenMobile !== mobile) {
      return false;
    }

    // Check if token is not too old (30 minutes max)
    const tokenTime = parseInt(timestamp, 10);
    const now = Date.now();
    if (now - tokenTime > 30 * 60 * 1000) {
      return false;
    }

    // Verify signature
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const data = `${tokenMobile}:${timestamp}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('hex');

    return signature === expectedSignature;
  } catch {
    return false;
  }
}

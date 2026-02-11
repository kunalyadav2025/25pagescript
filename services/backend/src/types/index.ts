// Script Types
export interface Script {
  scriptId: string;
  title: string;
  logline: string;
  synopsis: string;
  genre: Genre;
  language: string;
  pageCount: number;
  scriptFileS3Key: string;
  copyright: {
    hasCertificate: boolean;
    certificateNumber?: string;
  };
  writer: {
    name: string;
    mobile: string;
    mobileVerified: boolean;
  };
  payment: {
    orderId: string;
    paymentId: string;
    amount: number;
    status: 'PAID' | 'PENDING' | 'FAILED';
  };
  status: 'PUBLISHED' | 'PENDING_PAYMENT';
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export type Genre =
  | 'Drama'
  | 'Thriller'
  | 'Comedy'
  | 'Romance'
  | 'Action'
  | 'Horror'
  | 'Sci-Fi'
  | 'Mystery'
  | 'Family'
  | 'Documentary'
  | 'Other';

export const GENRES: Genre[] = [
  'Drama',
  'Thriller',
  'Comedy',
  'Romance',
  'Action',
  'Horror',
  'Sci-Fi',
  'Mystery',
  'Family',
  'Documentary',
  'Other',
];

// Comment Types
export interface Comment {
  scriptId: string;
  commentId: string;
  commenterName: string;
  commentText: string;
  createdAt: string;
}

// Reaction Types
export interface Reaction {
  scriptId: string;
  deviceId: string;
  reaction: 'LIKE' | 'DISLIKE';
  createdAt: string;
}

// OTP Types
export interface OTPRecord {
  otpId: string;
  mobile: string;
  otpHash: string;
  attempts: number;
  verified: boolean;
  createdAt: string;
  expiresAt: number; // TTL
}

// API Response Types
export interface APIResponse<T = any> {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Request Body Types
export interface SendOTPRequest {
  mobile: string;
}

export interface VerifyOTPRequest {
  otpId: string;
  otp: string;
}

export interface UploadScriptRequest {
  verificationToken: string;
  writerName: string;
  writerMobile: string;
  title: string;
  logline: string;
  synopsis: string;
  genre: Genre;
  language: string;
  hasCopyright: boolean;
  copyrightNumber?: string;
  scriptFileBase64: string;
  scriptFileName: string;
  pageCount: number;
}

export interface UpdateScriptRequest {
  verificationToken: string;
  writerMobile: string;
  title?: string;
  logline?: string;
  synopsis?: string;
  genre?: Genre;
  language?: string;
  hasCopyright?: boolean;
  copyrightNumber?: string;
}

export interface AddCommentRequest {
  name: string;
  comment: string;
}

export interface ReactionRequest {
  deviceId: string;
}

export interface VerifyPaymentRequest {
  scriptId: string;
  cashfreePaymentId: string;
}

// Cashfree Types
export interface CashfreeOrderRequest {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  customerName: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl: string;
}

export interface CashfreeWebhookPayload {
  orderId: string;
  orderAmount: string;
  referenceId: string;
  txStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  paymentMode: string;
  txMsg: string;
  txTime: string;
  signature: string;
}

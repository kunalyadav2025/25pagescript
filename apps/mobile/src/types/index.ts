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
  pdfUrl?: string;
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
  status: 'PUBLISHED' | 'DRAFT';
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  createdAt: string;
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

export const LANGUAGES = [
  'Hindi',
  'English',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Kannada',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Punjabi',
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
export type ReactionType = 'LIKE' | 'DISLIKE' | null;

export interface Reaction {
  scriptId: string;
  deviceId: string;
  reaction: 'LIKE' | 'DISLIKE';
  createdAt: string;
}

// API Response Types
export interface ScriptsListResponse {
  scripts: Script[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface OTPSendResponse {
  otpId: string;
  message: string;
}

export interface OTPVerifyResponse {
  verified: boolean;
  verificationToken: string;
}

export interface UploadScriptResponse {
  scriptId: string;
  paymentOrderId: string;
  paymentSessionId: string;
}

export interface ReactionResponse {
  likeCount: number;
  dislikeCount: number;
}

export interface GetReactionResponse {
  reaction: ReactionType;
}

// Upload Form Data
export interface UploadFormData {
  writerName: string;
  writerMobile: string;
  otpId: string;
  verificationToken: string;
  title: string;
  logline: string;
  synopsis: string;
  genre: Genre;
  language: string;
  hasCopyright: boolean;
  copyrightNumber: string;
  scriptFile: {
    uri: string;
    name: string;
    type: string;
  } | null;
  pageCount: number;
}

// Edit Form Data
export interface EditScriptFormData {
  writerMobile: string;
  otpId: string;
  verificationToken: string;
  title: string;
  logline: string;
  synopsis: string;
  genre: Genre;
  language: string;
  hasCopyright: boolean;
  copyrightNumber: string;
}

// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  ScriptDetail: { scriptId: string };
  Upload: undefined;
  Success: { scriptId: string; title: string };
  EditScript: { scriptId: string };
};

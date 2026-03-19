export type ContentType = 'scripts' | 'plots' | 'screenplay' | 'jokes';

export const CONTENT_TYPES: ContentType[] = ['scripts'];

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

export interface Script {
  scriptId: string;
  contentType?: ContentType;
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

export interface ScriptsListResponse {
  scripts: Script[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Reaction Types
export type ReactionType = 'LIKE' | 'DISLIKE' | null;

export interface ReactionResponse {
  likeCount: number;
  dislikeCount: number;
}

export interface GetReactionResponse {
  reaction: ReactionType;
}

// Comment Types
export interface Comment {
  scriptId: string;
  commentId: string;
  commenterName: string;
  commentText: string;
  createdAt: string;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Languages
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

// OTP Types
export interface OTPSendResponse {
  otpId: string;
  message: string;
}

export interface OTPVerifyResponse {
  verified: boolean;
  verificationToken: string;
}

// Upload Types
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
  scriptFile: File | null;
  pageCount: number;
}

export interface UploadScriptResponse {
  scriptId: string;
  paymentOrderId: string;
  paymentSessionId: string;
}

// Edit Script Types
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

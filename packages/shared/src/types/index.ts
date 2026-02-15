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

// Upload Form Data (Web version - uses File instead of RN file object)
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

// Theme Types
export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  secondaryBackground: string;
  card: string;
  border: string;
  divider: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  error: string;
  success: string;
}

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  secondaryBackground: '#FAFAFA',
  card: '#FFFFFF',
  border: '#DBDBDB',
  divider: '#EFEFEF',
  text: '#262626',
  textSecondary: '#8E8E8E',
  textMuted: '#C7C7C7',
  accent: '#0095F6',
  error: '#ED4956',
  success: '#10B981',
};

export const darkColors: ThemeColors = {
  background: '#000000',
  secondaryBackground: '#121212',
  card: '#000000',
  border: '#262626',
  divider: '#262626',
  text: '#FFFFFF',
  textSecondary: '#A8A8A8',
  textMuted: '#737373',
  accent: '#0095F6',
  error: '#ED4956',
  success: '#22C55E',
};

// Genre Colors
export const GENRE_COLORS: Record<Genre, string> = {
  'Drama': '#8B5CF6',
  'Thriller': '#EF4444',
  'Comedy': '#F59E0B',
  'Romance': '#EC4899',
  'Action': '#F97316',
  'Horror': '#DC2626',
  'Sci-Fi': '#06B6D4',
  'Mystery': '#7C3AED',
  'Family': '#10B981',
  'Documentary': '#6B7280',
  'Other': '#9CA3AF',
};

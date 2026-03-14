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

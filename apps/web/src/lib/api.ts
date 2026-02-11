import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  Script,
  ScriptsListResponse,
  CommentsResponse,
  Comment,
  OTPSendResponse,
  OTPVerifyResponse,
  UploadScriptResponse,
  ReactionResponse,
  GetReactionResponse,
  Genre,
} from '@25pagescript/shared';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/dev';

// Log the API URL in development
if (typeof window !== 'undefined') {
  console.log('[API] Base URL:', API_BASE_URL);
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Log detailed error info in development
        if (typeof window !== 'undefined') {
          console.error('[API Error]', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message,
            data: error.response?.data,
          });
        }

        // Check for network errors
        if (error.code === 'ERR_NETWORK' || !error.response) {
          return Promise.reject(new Error('Unable to connect to server. Please ensure the backend is running.'));
        }

        const message = (error.response?.data as any)?.message || error.message;
        return Promise.reject(new Error(message));
      }
    );
  }

  // ============ SCRIPTS ============

  async getScripts(params: {
    genre?: Genre;
    page?: number;
    limit?: number;
  }): Promise<ScriptsListResponse> {
    const response = await this.client.get('/scripts', { params });
    return response.data;
  }

  async getScriptById(scriptId: string): Promise<Script> {
    const response = await this.client.get(`/scripts/${scriptId}`);
    return response.data;
  }

  async getGenres(): Promise<Genre[]> {
    const response = await this.client.get('/genres');
    return response.data.genres;
  }

  // ============ LIKES & DISLIKES ============

  async likeScript(scriptId: string, deviceId: string): Promise<ReactionResponse> {
    const response = await this.client.post(`/scripts/${scriptId}/like`, { deviceId });
    return response.data;
  }

  async dislikeScript(scriptId: string, deviceId: string): Promise<ReactionResponse> {
    const response = await this.client.post(`/scripts/${scriptId}/dislike`, { deviceId });
    return response.data;
  }

  async getReaction(scriptId: string, deviceId: string): Promise<GetReactionResponse> {
    const response = await this.client.get(`/scripts/${scriptId}/reaction`, {
      params: { deviceId },
    });
    return response.data;
  }

  // ============ COMMENTS ============

  async getComments(
    scriptId: string,
    params: { page?: number; limit?: number }
  ): Promise<CommentsResponse> {
    const response = await this.client.get(`/scripts/${scriptId}/comments`, { params });
    return response.data;
  }

  async addComment(
    scriptId: string,
    data: { name: string; comment: string }
  ): Promise<Comment> {
    const response = await this.client.post(`/scripts/${scriptId}/comments`, data);
    return response.data;
  }

  // ============ OTP ============

  async sendOTP(mobile: string): Promise<OTPSendResponse> {
    const response = await this.client.post('/otp/send', { mobile });
    return response.data;
  }

  async verifyOTP(otpId: string, otp: string): Promise<OTPVerifyResponse> {
    const response = await this.client.post('/otp/verify', { otpId, otp });
    return response.data;
  }

  // ============ UPLOAD ============

  async uploadScript(data: {
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
  }): Promise<UploadScriptResponse> {
    const response = await this.client.post('/scripts/upload', data);
    return response.data;
  }

  // ============ EDIT SCRIPT ============

  async updateScript(
    scriptId: string,
    data: {
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
  ): Promise<Script> {
    const response = await this.client.patch(`/scripts/${scriptId}`, data);
    return response.data;
  }

  // ============ PAYMENTS ============

  async verifyPayment(scriptId: string, cashfreePaymentId: string): Promise<{ success: boolean; script: Script }> {
    const response = await this.client.post('/payments/verify', {
      scriptId,
      cashfreePaymentId,
    });
    return response.data;
  }

  async getPaymentStatus(scriptId: string): Promise<{ status: string; script?: Script }> {
    const response = await this.client.get(`/payments/status/${scriptId}`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;

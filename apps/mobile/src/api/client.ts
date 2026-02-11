import axios, { AxiosInstance, AxiosError } from 'axios';
import {
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
} from '../types';
import { getMockScripts, getMockScriptById, getMockComments, MOCK_SCRIPTS } from './mockData';

// API Base URL - Update this with your actual API Gateway URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.25pagescript.com';

// Enable mock mode when API is not available
const USE_MOCK_DATA = false; // Set to false when backend is deployed

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
    if (USE_MOCK_DATA) {
      const scripts = getMockScripts(params.genre);
      const page = params.page || 1;
      const limit = params.limit || 20;
      const start = (page - 1) * limit;
      const paginatedScripts = scripts.slice(start, start + limit);
      return {
        scripts: paginatedScripts,
        total: scripts.length,
        page,
        limit,
        hasMore: start + limit < scripts.length,
      };
    }
    const response = await this.client.get('/scripts', { params });
    return response.data;
  }

  async getScriptById(scriptId: string): Promise<Script> {
    if (USE_MOCK_DATA) {
      const script = getMockScriptById(scriptId);
      if (!script) throw new Error('Script not found');
      return script;
    }
    const response = await this.client.get(`/scripts/${scriptId}`);
    return response.data;
  }

  async getGenres(): Promise<Genre[]> {
    if (USE_MOCK_DATA) {
      return ['Drama', 'Thriller', 'Comedy', 'Romance', 'Action', 'Horror', 'Sci-Fi', 'Mystery', 'Family', 'Documentary', 'Other'];
    }
    const response = await this.client.get('/genres');
    return response.data.genres;
  }

  // ============ LIKES & DISLIKES ============

  async likeScript(scriptId: string, deviceId: string): Promise<ReactionResponse> {
    if (USE_MOCK_DATA) {
      const script = getMockScriptById(scriptId);
      if (!script) throw new Error('Script not found');
      // Simulate like (in mock mode, just return incremented count)
      return {
        likeCount: script.likeCount + 1,
        dislikeCount: script.dislikeCount,
      };
    }
    const response = await this.client.post(`/scripts/${scriptId}/like`, { deviceId });
    return response.data;
  }

  async dislikeScript(scriptId: string, deviceId: string): Promise<ReactionResponse> {
    if (USE_MOCK_DATA) {
      const script = getMockScriptById(scriptId);
      if (!script) throw new Error('Script not found');
      return {
        likeCount: script.likeCount,
        dislikeCount: script.dislikeCount + 1,
      };
    }
    const response = await this.client.post(`/scripts/${scriptId}/dislike`, { deviceId });
    return response.data;
  }

  async getReaction(scriptId: string, deviceId: string): Promise<GetReactionResponse> {
    if (USE_MOCK_DATA) {
      return { reaction: null }; // No existing reaction in mock mode
    }
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
    if (USE_MOCK_DATA) {
      const comments = getMockComments(scriptId);
      const page = params.page || 1;
      const limit = params.limit || 20;
      const start = (page - 1) * limit;
      const paginatedComments = comments.slice(start, start + limit);
      return {
        comments: paginatedComments,
        total: comments.length,
        page,
        limit,
        hasMore: start + limit < comments.length,
      };
    }
    const response = await this.client.get(`/scripts/${scriptId}/comments`, { params });
    return response.data;
  }

  async addComment(
    scriptId: string,
    data: { name: string; comment: string }
  ): Promise<Comment> {
    if (USE_MOCK_DATA) {
      // Simulate adding a comment
      return {
        scriptId,
        commentId: `mock-${Date.now()}`,
        commenterName: data.name,
        commentText: data.comment,
        createdAt: new Date().toISOString(),
      };
    }
    const response = await this.client.post(`/scripts/${scriptId}/comments`, data);
    return response.data;
  }

  // ============ OTP ============

  async sendOTP(mobile: string): Promise<OTPSendResponse> {
    if (USE_MOCK_DATA) {
      // Simulate OTP send
      return {
        otpId: `mock-otp-${Date.now()}`,
        message: 'OTP sent successfully (Mock Mode - use 123456)',
      };
    }
    const response = await this.client.post('/otp/send', { mobile });
    return response.data;
  }

  async verifyOTP(otpId: string, otp: string): Promise<OTPVerifyResponse> {
    if (USE_MOCK_DATA) {
      // Accept any 6-digit OTP in mock mode (use 123456)
      if (otp === '123456') {
        return {
          verified: true,
          verificationToken: `mock-token-${Date.now()}`,
        };
      }
      throw new Error('Invalid OTP. Use 123456 in mock mode.');
    }
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
    if (USE_MOCK_DATA) {
      // Simulate script upload
      return {
        scriptId: `mock-script-${Date.now()}`,
        paymentOrderId: `mock-order-${Date.now()}`,
        paymentSessionId: `mock-session-${Date.now()}`,
      };
    }
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
    if (USE_MOCK_DATA) {
      const existing = getMockScriptById(scriptId);
      if (!existing) throw new Error('Script not found');
      return {
        ...existing,
        ...data,
        copyright: data.hasCopyright !== undefined
          ? { hasCertificate: data.hasCopyright, certificateNumber: data.copyrightNumber }
          : existing.copyright,
      };
    }
    const response = await this.client.patch(`/scripts/${scriptId}`, data);
    return response.data;
  }

  // ============ PAYMENTS ============

  async verifyPayment(scriptId: string, cashfreePaymentId: string): Promise<{ success: boolean; script: Script }> {
    if (USE_MOCK_DATA) {
      return {
        success: true,
        script: MOCK_SCRIPTS[0],
      };
    }
    const response = await this.client.post('/payments/verify', {
      scriptId,
      cashfreePaymentId,
    });
    return response.data;
  }

  async getPaymentStatus(scriptId: string): Promise<{ status: string; script?: Script }> {
    if (USE_MOCK_DATA) {
      return {
        status: 'PAID',
        script: MOCK_SCRIPTS[0],
      };
    }
    const response = await this.client.get(`/payments/status/${scriptId}`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;

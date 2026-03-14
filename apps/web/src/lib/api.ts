import { Script, ScriptsListResponse, Genre, ReactionResponse, GetReactionResponse, Comment, CommentsResponse, OTPSendResponse, OTPVerifyResponse, UploadScriptResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.25pagescript.com';

export async function getScripts(params?: {
  genre?: Genre;
  page?: number;
  limit?: number;
}): Promise<ScriptsListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.genre) searchParams.set('genre', params.genre);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const url = `${API_BASE_URL}/scripts${searchParams.toString() ? `?${searchParams}` : ''}`;

  const response = await fetch(url, {
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!response.ok) {
    throw new Error('Failed to fetch scripts');
  }

  return response.json();
}

export async function getScriptById(scriptId: string): Promise<Script> {
  const response = await fetch(`${API_BASE_URL}/scripts/${scriptId}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch script');
  }

  return response.json();
}

// ============ REACTIONS ============

export async function likeScript(scriptId: string, deviceId: string): Promise<ReactionResponse> {
  const response = await fetch(`${API_BASE_URL}/scripts/${scriptId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deviceId }),
  });

  if (!response.ok) {
    throw new Error('Failed to like script');
  }

  return response.json();
}

export async function dislikeScript(scriptId: string, deviceId: string): Promise<ReactionResponse> {
  const response = await fetch(`${API_BASE_URL}/scripts/${scriptId}/dislike`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deviceId }),
  });

  if (!response.ok) {
    throw new Error('Failed to dislike script');
  }

  return response.json();
}

export async function getReaction(scriptId: string, deviceId: string): Promise<GetReactionResponse> {
  const response = await fetch(`${API_BASE_URL}/scripts/${scriptId}/reaction?deviceId=${encodeURIComponent(deviceId)}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to get reaction');
  }

  return response.json();
}

// ============ COMMENTS ============

export async function getComments(
  scriptId: string,
  params?: { page?: number; limit?: number }
): Promise<CommentsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const url = `${API_BASE_URL}/scripts/${scriptId}/comments${searchParams.toString() ? `?${searchParams}` : ''}`;

  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }

  return response.json();
}

export async function addComment(
  scriptId: string,
  data: { name: string; comment: string }
): Promise<Comment> {
  const response = await fetch(`${API_BASE_URL}/scripts/${scriptId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to post comment');
  }

  return response.json();
}

// ============ OTP ============

export async function sendOTP(mobile: string): Promise<OTPSendResponse> {
  const response = await fetch(`${API_BASE_URL}/otp/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mobile }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || 'Failed to send OTP');
  }

  return response.json();
}

export async function verifyOTP(otpId: string, otp: string): Promise<OTPVerifyResponse> {
  const response = await fetch(`${API_BASE_URL}/otp/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ otpId, otp }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || 'Failed to verify OTP');
  }

  return response.json();
}

// ============ UPLOAD ============

export async function uploadScript(data: {
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
  const response = await fetch(`${API_BASE_URL}/scripts/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to upload script');
  }

  return response.json();
}

// ============ EDIT SCRIPT ============

export async function updateScript(
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
  const response = await fetch(`${API_BASE_URL}/scripts/${scriptId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to update script');
  }

  return response.json();
}

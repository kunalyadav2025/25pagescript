import { Script, ScriptsListResponse, Genre, ReactionResponse, GetReactionResponse } from '@/types';

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

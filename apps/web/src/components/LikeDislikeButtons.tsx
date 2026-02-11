'use client';

import { useState, useEffect } from 'react';
import type { ReactionType } from '@25pagescript/shared';
import { formatCount } from '@25pagescript/shared';
import { apiClient } from '@/lib/api';
import { getDeviceId } from '@/lib/deviceId';

interface LikeDislikeButtonsProps {
  scriptId: string;
  initialLikeCount: number;
  initialDislikeCount: number;
  compact?: boolean;
}

export default function LikeDislikeButtons({
  scriptId,
  initialLikeCount,
  initialDislikeCount,
  compact = false,
}: LikeDislikeButtonsProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [reaction, setReaction] = useState<ReactionType>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReaction = async () => {
      try {
        const deviceId = getDeviceId();
        const response = await apiClient.getReaction(scriptId, deviceId);
        setReaction(response.reaction);
      } catch (error) {
        console.error('Failed to fetch reaction:', error);
      }
    };
    fetchReaction();
  }, [scriptId]);

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const deviceId = getDeviceId();
      const response = await apiClient.likeScript(scriptId, deviceId);
      setLikeCount(response.likeCount);
      setDislikeCount(response.dislikeCount);
      setReaction(reaction === 'LIKE' ? null : 'LIKE');
    } catch (error) {
      console.error('Failed to like script:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const deviceId = getDeviceId();
      const response = await apiClient.dislikeScript(scriptId, deviceId);
      setLikeCount(response.likeCount);
      setDislikeCount(response.dislikeCount);
      setReaction(reaction === 'DISLIKE' ? null : 'DISLIKE');
    } catch (error) {
      console.error('Failed to dislike script:', error);
    } finally {
      setLoading(false);
    }
  };

  const iconSize = compact ? 'w-4 h-4' : 'w-5 h-5';
  const buttonPadding = compact ? 'px-2 py-1' : 'px-4 py-2';
  const fontSize = compact ? 'text-xs' : 'text-base';
  const gap = compact ? 'gap-2' : 'gap-4';
  const innerGap = compact ? 'gap-1' : 'gap-2';

  return (
    <div className={`flex items-center ${gap}`}>
      <button
        onClick={handleLike}
        disabled={loading}
        className={`flex items-center ${innerGap} ${buttonPadding} rounded-lg transition-all ${
          reaction === 'LIKE'
            ? 'bg-accent/10 text-accent border border-accent'
            : 'bg-secondary-bg text-foreground border border-border hover:border-accent'
        } disabled:opacity-50`}
      >
        <svg
          className={`${iconSize} ${reaction === 'LIKE' ? 'fill-current' : ''}`}
          fill={reaction === 'LIKE' ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
        <span className={`font-semibold ${fontSize}`}>{formatCount(likeCount)}</span>
      </button>

      <button
        onClick={handleDislike}
        disabled={loading}
        className={`flex items-center ${innerGap} ${buttonPadding} rounded-lg transition-all ${
          reaction === 'DISLIKE'
            ? 'bg-error/10 text-error border border-error'
            : 'bg-secondary-bg text-foreground border border-border hover:border-error'
        } disabled:opacity-50`}
      >
        <svg
          className={`${iconSize} ${reaction === 'DISLIKE' ? 'fill-current' : ''}`}
          fill={reaction === 'DISLIKE' ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
          />
        </svg>
        <span className={`font-semibold ${fontSize}`}>{formatCount(dislikeCount)}</span>
      </button>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReactionType } from '@/types';
import { likeScript, dislikeScript, getReaction } from '@/lib/api';
import { getDeviceId } from '@/lib/deviceId';

interface LikeDislikeButtonsProps {
  scriptId: string;
  initialLikeCount: number;
  initialDislikeCount: number;
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export default function LikeDislikeButtons({
  scriptId,
  initialLikeCount,
  initialDislikeCount,
}: LikeDislikeButtonsProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [userReaction, setUserReaction] = useState<ReactionType>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch current user's reaction on mount
  useEffect(() => {
    const fetchReaction = async () => {
      try {
        const deviceId = getDeviceId();
        if (!deviceId) {
          setLoading(false);
          return;
        }
        const response = await getReaction(scriptId, deviceId);
        setUserReaction(response.reaction);
      } catch (error) {
        console.error('Failed to fetch reaction:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReaction();
  }, [scriptId]);

  const handleLike = useCallback(async () => {
    if (actionLoading || userReaction === 'LIKE') return;

    setActionLoading(true);
    try {
      const deviceId = getDeviceId();
      if (!deviceId) {
        console.error('No device ID available');
        return;
      }
      const response = await likeScript(scriptId, deviceId);
      setLikeCount(response.likeCount);
      setDislikeCount(response.dislikeCount);
      setUserReaction('LIKE');
    } catch (error) {
      console.error('Failed to like script:', error);
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, userReaction, scriptId]);

  const handleDislike = useCallback(async () => {
    if (actionLoading || userReaction === 'DISLIKE') return;

    setActionLoading(true);
    try {
      const deviceId = getDeviceId();
      if (!deviceId) {
        console.error('No device ID available');
        return;
      }
      const response = await dislikeScript(scriptId, deviceId);
      setLikeCount(response.likeCount);
      setDislikeCount(response.dislikeCount);
      setUserReaction('DISLIKE');
    } catch (error) {
      console.error('Failed to dislike script:', error);
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, userReaction, scriptId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="animate-pulse bg-gray-700 rounded-full h-10 w-24"></div>
        <div className="animate-pulse bg-gray-700 rounded-full h-10 w-24"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleLike}
        disabled={actionLoading || userReaction === 'LIKE'}
        className={`
          flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all
          ${userReaction === 'LIKE'
            ? 'bg-red-500/10 border-red-500 text-red-500'
            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600 hover:text-white'
          }
          ${(actionLoading || userReaction === 'LIKE') ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
        `}
      >
        <span className="text-lg">❤️</span>
        <span className="font-semibold">{formatCount(likeCount)}</span>
      </button>

      <button
        onClick={handleDislike}
        disabled={actionLoading || userReaction === 'DISLIKE'}
        className={`
          flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all
          ${userReaction === 'DISLIKE'
            ? 'bg-gray-500/10 border-gray-500 text-gray-400'
            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600 hover:text-white'
          }
          ${(actionLoading || userReaction === 'DISLIKE') ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
        `}
      >
        <span className="text-lg">👎</span>
        <span className="font-semibold">{formatCount(dislikeCount)}</span>
      </button>

      {actionLoading && (
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      )}
    </div>
  );
}

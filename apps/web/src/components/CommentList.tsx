'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Comment } from '@25pagescript/shared';
import { formatRelativeTime } from '@25pagescript/shared';
import { apiClient } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';

interface CommentListProps {
  scriptId: string;
  commentCount: number;
  refreshTrigger?: number;
}

export default function CommentList({ scriptId, commentCount, refreshTrigger = 0 }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadComments = useCallback(async (pageNum: number, replace = false) => {
    try {
      const response = await apiClient.getComments(scriptId, { page: pageNum, limit: 10 });
      if (replace) {
        setComments(response.comments);
      } else {
        setComments((prev) => [...prev, ...response.comments]);
      }
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  }, [scriptId]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    loadComments(1, true).finally(() => setLoading(false));
  }, [loadComments, refreshTrigger]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await loadComments(nextPage);
    setPage(nextPage);
    setLoadingMore(false);
  };

  return (
    <div className="border-b border-border">
      <div className="p-5 border-b border-divider">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-accent">
          Comments ({commentCount})
        </h3>
      </div>

      {loading ? (
        <div className="p-8 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : comments.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-lg text-text-secondary">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div>
          {comments.map((comment) => (
            <div key={comment.commentId} className="p-5 border-b border-divider last:border-b-0">
              <div className="flex items-start justify-between mb-3">
                <span className="text-lg font-semibold text-foreground">{comment.commenterName}</span>
                <span className="text-sm text-text-muted">{formatRelativeTime(comment.createdAt)}</span>
              </div>
              <p className="text-base text-text-secondary whitespace-pre-wrap leading-relaxed">{comment.commentText}</p>
            </div>
          ))}

          {hasMore && (
            <div className="p-5 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-lg text-accent font-medium hover:underline disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load more comments'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

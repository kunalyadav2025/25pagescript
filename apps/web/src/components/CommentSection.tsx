'use client';

import { useState, useEffect, useCallback } from 'react';
import { Comment } from '@/types';
import { getComments } from '@/lib/api';
import CommentItem from './CommentItem';
import AddCommentForm from './AddCommentForm';

interface CommentSectionProps {
  scriptId: string;
  initialCommentCount: number;
}

export default function CommentSection({ scriptId, initialCommentCount }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(
    async (pageNum: number, replace = false) => {
      try {
        const response = await getComments(scriptId, {
          page: pageNum,
          limit: 20,
        });

        if (replace) {
          setComments(response.comments);
        } else {
          setComments((prev) => [...prev, ...response.comments]);
        }

        setHasMore(response.hasMore);
        setCommentCount(response.total);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load comments';
        setError(message);
      }
    },
    [scriptId]
  );

  // Initial load
  useEffect(() => {
    setLoading(true);
    loadComments(1, true).finally(() => setLoading(false));
  }, [loadComments]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    await loadComments(nextPage);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleCommentAdded = () => {
    // Refresh comments from the beginning
    setPage(1);
    setLoading(true);
    loadComments(1, true).finally(() => setLoading(false));
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    loadComments(1, true).finally(() => setLoading(false));
  };

  return (
    <div className="border-t border-gray-800 pt-6 mt-6">
      {/* Add Comment Form */}
      <div className="mb-8">
        <AddCommentForm scriptId={scriptId} onCommentAdded={handleCommentAdded} />
      </div>

      {/* Comments Header */}
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
      </h3>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Comments List */}
      {!loading && !error && (
        <>
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 font-medium">No comments yet</p>
              <p className="text-gray-500 text-sm mt-1">Be the first to comment!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {comments.map((comment) => (
                <CommentItem key={comment.commentId} comment={comment} />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && comments.length > 0 && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </span>
                ) : (
                  'Load more comments'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

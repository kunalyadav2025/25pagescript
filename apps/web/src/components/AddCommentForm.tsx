'use client';

import { useState } from 'react';
import { addComment } from '@/lib/api';

interface AddCommentFormProps {
  scriptId: string;
  onCommentAdded: () => void;
}

export default function AddCommentForm({ scriptId, onCommentAdded }: AddCommentFormProps) {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedComment = comment.trim();

    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }

    if (!trimmedComment) {
      setError('Please enter a comment');
      return;
    }

    if (trimmedComment.length > 500) {
      setError('Comment must be 500 characters or less');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addComment(scriptId, {
        name: trimmedName,
        comment: trimmedComment,
      });

      setComment('');
      onCommentAdded();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to post comment';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Add a Comment
      </h3>

      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
        disabled={loading}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 disabled:opacity-50"
      />

      <textarea
        placeholder="Write your comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={3}
        disabled={loading}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 resize-none disabled:opacity-50"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {comment.length}/500
        </span>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Posting...
            </>
          ) : (
            'Post'
          )}
        </button>
      </div>
    </form>
  );
}

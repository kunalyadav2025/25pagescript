'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

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

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!comment.trim()) {
      setError('Please enter a comment');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.addComment(scriptId, {
        name: name.trim(),
        comment: comment.trim(),
      });
      setName('');
      setComment('');
      onCommentAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-secondary-bg">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-accent mb-4">
        Add a Comment
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50"
            maxLength={50}
          />
        </div>

        <div>
          <textarea
            placeholder="Write your comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={loading}
            rows={3}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50 resize-none"
            maxLength={1000}
          />
        </div>

        {error && (
          <p className="text-sm text-error">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
}

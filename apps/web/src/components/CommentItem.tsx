'use client';

import { Comment } from '@/types';

interface CommentItemProps {
  comment: Comment;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

export default function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className="flex gap-3 py-3">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-semibold text-gray-300">
          {comment.commenterName.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-white text-sm">
            {comment.commenterName}
          </span>
          <span className="text-gray-500 text-xs">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed break-words">
          {comment.commentText}
        </p>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Script } from '@/types';

interface ScriptCardProps {
  script: Script;
}

export default function ScriptCard({ script }: ScriptCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Link href={`/script?id=${script.scriptId}`}>
      <article className="bg-gray-900 rounded-lg p-5 hover:bg-gray-800 transition-colors border border-gray-800 hover:border-gray-700">
        {/* Genre Badge */}
        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded mb-3">
          {script.genre}
        </span>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
          {script.title}
        </h3>

        {/* Logline */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {script.logline}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{script.writer.name}</span>
          <div className="flex items-center gap-3">
            <span>{script.pageCount} pages</span>
            <span>{formatDate(script.createdAt)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span>👍</span> {script.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <span>👎</span> {script.dislikeCount}
          </span>
          <span className="flex items-center gap-1">
            <span>💬</span> {script.commentCount}
          </span>
        </div>
      </article>
    </Link>
  );
}

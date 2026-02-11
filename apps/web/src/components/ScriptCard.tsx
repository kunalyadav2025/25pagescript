'use client';

import Link from 'next/link';
import type { Script, Genre } from '@25pagescript/shared';
import { formatRelativeTime, truncateText } from '@25pagescript/shared';

const GENRE_COLORS: Record<Genre, string> = {
  'Drama': 'bg-genre-drama',
  'Thriller': 'bg-genre-thriller',
  'Comedy': 'bg-genre-comedy',
  'Romance': 'bg-genre-romance',
  'Action': 'bg-genre-action',
  'Horror': 'bg-genre-horror',
  'Sci-Fi': 'bg-genre-scifi',
  'Mystery': 'bg-genre-mystery',
  'Family': 'bg-genre-family',
  'Documentary': 'bg-genre-documentary',
  'Other': 'bg-genre-other',
};

interface ScriptCardProps {
  script: Script;
}

export default function ScriptCard({ script }: ScriptCardProps) {
  const genreColor = GENRE_COLORS[script.genre] || GENRE_COLORS['Other'];

  return (
    <Link href={`/scripts/${script.scriptId}`}>
      <article className="border-b border-border hover:bg-secondary-bg/50 transition-colors">
        <div className="p-5 md:p-6">
          {/* Meta Row */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className={`${genreColor} px-4 py-1.5 rounded-full text-sm font-semibold text-white`}>
              {script.genre}
            </span>
            <span className="text-base text-text-secondary">{script.language}</span>
            <span className="text-text-secondary">•</span>
            <span className="text-base text-text-secondary">{script.pageCount} pages</span>
          </div>

          {/* Title */}
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 line-clamp-2">
            {script.title}
          </h2>

          {/* Logline */}
          <p className="text-text-secondary text-base md:text-lg mb-4 line-clamp-2">
            {truncateText(script.logline, 150)}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5 text-base text-text-secondary">
              <span className="flex items-center gap-1.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                {script.likeCount}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                {script.commentCount}
              </span>
            </div>
            <span className="text-sm text-text-muted">
              {formatRelativeTime(script.createdAt)}
            </span>
          </div>

          {/* Writer */}
          <div className="mt-4 pt-4 border-t border-divider flex items-center justify-between">
            <span className="text-base text-text-secondary">
              by <span className="font-medium text-foreground">{script.writer.name}</span>
            </span>
            {script.copyright.hasCertificate && (
              <span className="text-sm text-success flex items-center gap-1">
                <span>&#128274;</span> Copyrighted
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

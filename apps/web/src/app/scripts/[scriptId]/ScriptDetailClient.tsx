'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Script, Genre } from '@25pagescript/shared';
import { formatDate, GENRE_COLORS } from '@25pagescript/shared';
import { apiClient } from '@/lib/api';
import { Header, LikeDislikeButtons, ContactCard, CommentList, AddCommentForm, LoadingSpinner } from '@/components';

// Dynamic import for PDFViewer to avoid SSR issues with react-pdf
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="p-10 flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-text-secondary">Loading PDF viewer...</p>
    </div>
  ),
});

type FontSizeOption = 'normal' | 'large' | 'xlarge';

interface ScriptDetailClientProps {
  initialScript: Script | null;
  initialError: string | null;
  scriptId: string;
}

export default function ScriptDetailClient({ initialScript, initialError, scriptId }: ScriptDetailClientProps) {
  const [script, setScript] = useState<Script | null>(initialScript);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [commentRefreshTrigger, setCommentRefreshTrigger] = useState(0);
  const [fontSize, setFontSize] = useState<FontSizeOption>('normal');

  const loadScript = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getScriptById(scriptId);
      setScript(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load script';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [scriptId]);

  const handleCommentAdded = () => {
    setCommentRefreshTrigger((prev) => prev + 1);
    if (script) {
      setScript({ ...script, commentCount: script.commentCount + 1 });
    }
  };

  const genreColor = script ? GENRE_COLORS[script.genre] : '#0095F6';

  if (loading || (!script && !error)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-16 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-text-secondary">Loading script...</p>
        </div>
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-16 text-center">
          <p className="text-error mb-4">{error || 'Script not found'}</p>
          <button
            onClick={loadScript}
            className="px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 mb-4"
          >
            Retry
          </button>
          <br />
          <Link href="/" className="text-text-secondary hover:text-foreground">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="w-full max-w-6xl mx-auto px-4 md:px-8">
        {/* Back to Home Button */}
        <div className="py-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-accent hover:text-accent/80 hover:bg-accent/10 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>

        {/* Hero Header Section - Compact */}
        <div className="bg-secondary-bg border-b border-border rounded-t-xl">
          <div style={{ backgroundColor: genreColor, height: '3px' }} />
          <div className="px-4 py-3 md:px-6 md:py-4">
            {/* Top Row: Meta + Copyright + Edit */}
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: genreColor }}
                >
                  {script.genre}
                </span>
                <span className="text-xs text-text-secondary">{script.language}</span>
                <span className="text-text-secondary text-xs">•</span>
                <span className="text-xs text-text-secondary">{script.pageCount}p</span>
                <span className="text-text-secondary text-xs">•</span>
                <span className="text-xs text-text-secondary">{formatDate(script.createdAt)}</span>
              </div>
              <Link
                href={`/edit/${script.scriptId}`}
                className="px-2.5 py-1 border border-accent text-accent rounded text-xs font-medium hover:bg-accent/10 transition-colors"
              >
                Edit
              </Link>
            </div>

            {/* Title + Like/Dislike Row */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight flex-1">
                {script.title}
              </h1>
              <LikeDislikeButtons
                scriptId={script.scriptId}
                initialLikeCount={script.likeCount}
                initialDislikeCount={script.dislikeCount}
                compact
              />
            </div>

            {/* Copyright Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm mt-3 ${
                script.copyright.hasCertificate
                  ? 'bg-success/10 text-success border border-success/30'
                  : 'bg-orange-500/10 text-orange-500 border border-orange-500/30'
              }`}
            >
              <span>
                {script.copyright.hasCertificate ? '🔒' : '🔓'}
              </span>
              <span className="font-semibold">
                {script.copyright.hasCertificate
                  ? `Copyright: ${script.copyright.certificateNumber}`
                  : 'Not Copyrighted'}
              </span>
            </div>
          </div>
        </div>

        {/* Font Size Control */}
        <div className="flex items-center justify-between px-4 py-2 bg-secondary-bg border-b border-divider">
          <span className="text-sm font-semibold text-text-secondary">Text Size</span>
          <div className="flex gap-2">
            {(['normal', 'large', 'xlarge'] as FontSizeOption[]).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`w-9 h-9 rounded-full border font-bold transition-all ${
                  fontSize === size
                    ? 'bg-accent border-accent text-white'
                    : 'bg-background border-border text-foreground hover:border-accent'
                }`}
                style={{
                  fontSize: size === 'normal' ? '14px' : size === 'large' ? '17px' : '20px',
                }}
              >
                A
              </button>
            ))}
          </div>
        </div>

        {/* Logline & Synopsis Section - Compact */}
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-divider">
          <div className="flex flex-col md:flex-row md:gap-8">
            {/* The Pitch */}
            <div className="flex-1 mb-3 md:mb-0">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">
                THE PITCH
              </h2>
              <p
                className="text-base md:text-lg font-medium italic text-foreground line-clamp-3"
                style={{
                  fontSize: fontSize === 'normal' ? undefined : fontSize === 'large' ? '1.15rem' : '1.25rem',
                }}
              >
                "{script.logline}"
              </p>
            </div>

            {/* Synopsis */}
            <div className="flex-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">
                SYNOPSIS
              </h2>
              <p
                className="text-sm md:text-base text-text-secondary leading-relaxed line-clamp-4"
                style={{
                  fontSize: fontSize === 'normal' ? undefined : fontSize === 'large' ? '1rem' : '1.1rem',
                }}
              >
                {script.synopsis}
              </p>
            </div>
          </div>
        </div>

        {/* Full Script Content */}
        {script.pdfUrl && (
          <PDFViewer pdfUrl={script.pdfUrl} fontSize={fontSize} />
        )}

        {/* Writer Contact */}
        <ContactCard writerName={script.writer.name} mobile={script.writer.mobile} />

        {/* Comments Section */}
        <CommentList
          scriptId={script.scriptId}
          commentCount={script.commentCount}
          refreshTrigger={commentRefreshTrigger}
        />

        {/* Add Comment Form */}
        <AddCommentForm
          scriptId={script.scriptId}
          onCommentAdded={handleCommentAdded}
        />

        {/* Bottom Padding */}
        <div className="h-10" />
      </main>
    </div>
  );
}

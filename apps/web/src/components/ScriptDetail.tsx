'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Script } from '@/types';
import { getScriptById } from '@/lib/api';
import LikeDislikeButtons from './LikeDislikeButtons';
import CommentSection from './CommentSection';

// Dynamic import for InlinePdfViewer to avoid SSR issues with react-pdf
const InlinePdfViewer = dynamic(() => import('./InlinePdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-gray-400 dark:text-gray-400">Loading PDF viewer...</div>
    </div>
  ),
});

type FontSize = 'normal' | 'large' | 'xlarge';

const FONT_SIZE_CONFIG: Record<FontSize, { label: string; scale: number }> = {
  normal: { label: 'A', scale: 1.0 },
  large: { label: 'A', scale: 1.2 },
  xlarge: { label: 'A', scale: 1.4 },
};

const GENRE_COLORS: Record<string, string> = {
  'Drama': '#8B5CF6',
  'Thriller': '#EF4444',
  'Comedy': '#F59E0B',
  'Romance': '#EC4899',
  'Action': '#F97316',
  'Horror': '#DC2626',
  'Sci-Fi': '#06B6D4',
  'Mystery': '#7C3AED',
  'Family': '#10B981',
  'Documentary': '#6B7280',
  'Other': '#9CA3AF',
};

interface ScriptDetailProps {
  scriptId: string;
}

export default function ScriptDetail({ scriptId }: ScriptDetailProps) {
  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<FontSize>('normal');

  useEffect(() => {
    async function fetchScript() {
      try {
        setLoading(true);
        setError(null);
        const data = await getScriptById(scriptId);
        setScript(data);
      } catch (err) {
        setError('Failed to load script. Please try again.');
        console.error('Error fetching script:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchScript();
  }, [scriptId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-gray-600 dark:text-gray-400">Loading script...</div>
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-black">
        <div className="text-red-500 dark:text-red-400">{error || 'Script not found'}</div>
        <Link
          href="/"
          className="text-blue-500 dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const fontScale = FONT_SIZE_CONFIG[fontSize].scale;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Bar: Back Button & Edit Script */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Scripts
          </Link>
          <div className="flex items-center gap-4">
            {/* Font Size Control - Mobile Style */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Size</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setFontSize('normal')}
                  className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${
                    fontSize === 'normal'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-xs font-bold">A</span>
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${
                    fontSize === 'large'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-sm font-bold">A</span>
                </button>
                <button
                  onClick={() => setFontSize('xlarge')}
                  className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${
                    fontSize === 'xlarge'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-base font-bold">A</span>
                </button>
              </div>
            </div>
            <Link
              href={`/edit?id=${script.scriptId}`}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors px-2 py-1 border border-gray-300 dark:border-gray-700 rounded hover:border-gray-500"
            >
              Edit Script
            </Link>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Script Info */}
          <div className="lg:w-1/3 xl:w-1/4">
            {/* Header Section - Compact */}
            <div className="mb-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              {/* Genre accent bar */}
              <div
                className="h-1 -mx-3 -mt-3 mb-3 rounded-t-lg"
                style={{ backgroundColor: GENRE_COLORS[script.genre] || GENRE_COLORS['Other'] }}
              />

              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className="inline-block px-2 py-0.5 text-xs font-semibold text-white rounded"
                  style={{ backgroundColor: GENRE_COLORS[script.genre] || GENRE_COLORS['Other'] }}
                >
                  {script.genre}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{script.language}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{script.pageCount}p</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(script.createdAt)}</span>
              </div>

              <div className="flex items-start justify-between gap-2 mb-2">
                <h1 className="text-lg font-bold text-black dark:text-white leading-tight">{script.title}</h1>
                <LikeDislikeButtons
                  scriptId={script.scriptId}
                  initialLikeCount={script.likeCount}
                  initialDislikeCount={script.dislikeCount}
                />
              </div>

              {/* Copyright Badge - Shows full number */}
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                script.copyright.hasCertificate
                  ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                  : 'bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800'
              }`}>
                <span>{script.copyright.hasCertificate ? '🔒' : '🔓'}</span>
                <span className={`font-semibold ${
                  script.copyright.hasCertificate
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-orange-700 dark:text-orange-400'
                }`}>
                  {script.copyright.hasCertificate
                    ? `Copyright: ${script.copyright.certificateNumber || 'Protected'}`
                    : 'Not Copyrighted'}
                </span>
              </div>
            </div>

            {/* THE PITCH & SYNOPSIS - Side by Side */}
            <div className="mb-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="flex gap-4">
                {/* Pitch */}
                <div className="flex-1">
                  <h2 className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-1">
                    The Pitch
                  </h2>
                  <p
                    className="text-gray-800 dark:text-gray-200 italic leading-snug line-clamp-4"
                    style={{ fontSize: `${fontScale * 0.8125}rem` }}
                  >
                    "{script.logline}"
                  </p>
                </div>
                {/* Synopsis */}
                <div className="flex-1">
                  <h2 className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-1">
                    Synopsis
                  </h2>
                  <p
                    className="text-gray-600 dark:text-gray-400 leading-snug line-clamp-4"
                    style={{ fontSize: `${fontScale * 0.75}rem` }}
                  >
                    {script.synopsis}
                  </p>
                </div>
              </div>
            </div>

            {/* Writer Contact Section - Compact */}
            <div className="mb-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <h2 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Writer
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                  {script.writer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-black dark:text-white">{script.writer.name}</p>
                  {script.writer.mobile && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {script.writer.mobile}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Comments & Stats - Compact */}
            <div className="mb-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <span>💬</span>
                <span>{script.commentCount} comments</span>
              </div>
            </div>

            {/* Comments Section - Mobile Only */}
            <div className="lg:hidden">
              <CommentSection
                scriptId={script.scriptId}
                initialCommentCount={script.commentCount}
              />
            </div>
          </div>

          {/* Right Column - PDF Content */}
          <div className="lg:w-2/3 xl:w-3/4">
            {script.pdfUrl ? (
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  Full Script
                </h2>
                <InlinePdfViewer pdfUrl={script.pdfUrl} fontScale={fontScale} />
              </div>
            ) : (
              <div className="w-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-500 font-semibold py-12 px-6 rounded-lg text-center">
                Script PDF not available
              </div>
            )}

            {/* Comments Section - Desktop Only */}
            <div className="hidden lg:block mt-6">
              <CommentSection
                scriptId={script.scriptId}
                initialCommentCount={script.commentCount}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

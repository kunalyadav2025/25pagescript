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
  normal: { label: 'Normal', scale: 1.0 },
  large: { label: 'Large', scale: 1.2 },
  xlarge: { label: 'X-Large', scale: 1.4 },
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
            {/* Font Size Control */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">Font:</span>
              <div className="flex gap-1">
                {(Object.keys(FONT_SIZE_CONFIG) as FontSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      fontSize === size
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {FONT_SIZE_CONFIG[size].label}
                  </button>
                ))}
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
            {/* Header Section */}
            <div className="mb-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                  {script.genre}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{script.language}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{script.pageCount} pages</span>
              </div>

              <h1 className="text-xl font-bold text-black dark:text-white mb-2">{script.title}</h1>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{formatDate(script.createdAt)}</p>

              {/* Copyright Badge */}
              {script.copyright.hasCertificate && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="font-medium">Copyright</span>
                </div>
              )}
            </div>

            {/* Reactions */}
            <div className="mb-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <LikeDislikeButtons
                  scriptId={script.scriptId}
                  initialLikeCount={script.likeCount}
                  initialDislikeCount={script.dislikeCount}
                />
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-sm">
                  <span>💬</span>
                  <span>{script.commentCount}</span>
                </div>
              </div>
            </div>

            {/* THE PITCH Section */}
            <div className="mb-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                The Pitch
              </h2>
              <p
                className="text-gray-800 dark:text-gray-200 italic leading-relaxed"
                style={{ fontSize: `${fontScale * 0.875}rem` }}
              >
                "{script.logline}"
              </p>
            </div>

            {/* SYNOPSIS Section */}
            <div className="mb-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Synopsis
              </h2>
              <p
                className="text-gray-800 dark:text-gray-200 leading-relaxed"
                style={{ fontSize: `${fontScale * 0.875}rem` }}
              >
                {script.synopsis}
              </p>
            </div>

            {/* Writer Contact Section */}
            <div className="mb-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Writer
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold">
                  {script.writer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-black dark:text-white">{script.writer.name}</p>
                  {script.writer.mobile && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {script.writer.mobile}
                    </p>
                  )}
                </div>
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

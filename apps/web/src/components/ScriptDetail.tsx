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
      <div className="text-gray-400">Loading PDF viewer...</div>
    </div>
  ),
});

interface ScriptDetailProps {
  scriptId: string;
}

export default function ScriptDetail({ scriptId }: ScriptDetailProps) {
  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading script...</div>
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-red-400">{error || 'Script not found'}</div>
        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Top Bar: Back Button & Edit Script */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
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
          <Link
            href={`/edit?id=${script.scriptId}`}
            className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 border border-gray-700 rounded hover:border-gray-500"
          >
            Edit Script
          </Link>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-block px-3 py-1 text-sm font-medium bg-gray-800 text-gray-300 rounded">
              {script.genre}
            </span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400">{script.language}</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400">{script.pageCount} pages</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">{script.title}</h1>

          <p className="text-lg text-gray-300 leading-relaxed">
            {script.logline}
          </p>
        </div>

        {/* Metadata Row: Writer, Synopsis, Copyright */}
        <div className="flex flex-wrap items-start gap-4 text-xs mb-4 bg-gray-900 rounded-lg p-3 border border-gray-800">
          {/* Written by */}
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Written by</span>
            <span className="text-white font-medium">{script.writer.name}</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-500">{formatDate(script.createdAt)}</span>
          </div>

          <span className="text-gray-700">|</span>

          {/* Synopsis */}
          <div className="flex items-start gap-1 flex-1 min-w-0">
            <span className="text-gray-500 shrink-0">Synopsis:</span>
            <span className="text-gray-400 truncate">{script.synopsis}</span>
          </div>

          {/* Copyright */}
          {script.copyright.hasCertificate && (
            <>
              <span className="text-gray-700">|</span>
              <div className="flex items-center gap-1">
                <svg
                  className="w-3 h-3 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span className="text-green-400 font-medium">Copyright</span>
                {script.copyright.certificateNumber && (
                  <span className="text-gray-500">• {script.copyright.certificateNumber}</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Reactions & Stats */}
        <div className="flex flex-wrap items-center gap-6 py-4 border-y border-gray-800 mb-6">
          <LikeDislikeButtons
            scriptId={script.scriptId}
            initialLikeCount={script.likeCount}
            initialDislikeCount={script.dislikeCount}
          />
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-xl">💬</span>
            <span>{script.commentCount} comments</span>
          </div>
        </div>

        {/* Script Content */}
        {script.pdfUrl ? (
          <div className="mb-6">
            <InlinePdfViewer pdfUrl={script.pdfUrl} />
          </div>
        ) : (
          <div className="w-full bg-gray-800 text-gray-500 font-semibold py-3 px-6 rounded-lg text-center mb-6">
            Script PDF not available
          </div>
        )}

        {/* Comments Section */}
        <CommentSection
          scriptId={script.scriptId}
          initialCommentCount={script.commentCount}
        />
      </div>
    </div>
  );
}

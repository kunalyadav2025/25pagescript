'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Script } from '@/types';
import { getScriptById } from '@/lib/api';
import LikeDislikeButtons from './LikeDislikeButtons';
import CommentSection from './CommentSection';

// Dynamic import for PdfViewer to avoid SSR issues with react-pdf
const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
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
  const [showPdfViewer, setShowPdfViewer] = useState(false);

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
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6"
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

        {/* Writer Info */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
          <div className="text-sm text-gray-500 mb-1">Written by</div>
          <div className="text-white font-medium">{script.writer.name}</div>
          <div className="text-gray-500 text-sm mt-1">
            {formatDate(script.createdAt)}
          </div>
        </div>

        {/* Synopsis */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">Synopsis</h2>
          <p className="text-gray-400 leading-relaxed whitespace-pre-line">
            {script.synopsis}
          </p>
        </div>

        {/* Copyright Info */}
        {script.copyright.hasCertificate && (
          <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
            <div className="flex items-center gap-2 text-green-400">
              <svg
                className="w-5 h-5"
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
              <span className="font-medium">Copyright Registered</span>
            </div>
            {script.copyright.certificateNumber && (
              <div className="text-gray-500 text-sm mt-1">
                Certificate: {script.copyright.certificateNumber}
              </div>
            )}
          </div>
        )}

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

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Read Script Button */}
          {script.pdfUrl ? (
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              onClick={() => setShowPdfViewer(true)}
            >
              Read Script
            </button>
          ) : (
            <div className="w-full bg-gray-800 text-gray-500 font-semibold py-3 px-6 rounded-lg text-center">
              Script PDF not available
            </div>
          )}

          {/* Edit Script Button */}
          <Link
            href={`/edit?id=${script.scriptId}`}
            className="block w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center border border-gray-700"
          >
            Edit Script
          </Link>
        </div>

        {/* Comments Section */}
        <CommentSection
          scriptId={script.scriptId}
          initialCommentCount={script.commentCount}
        />
      </div>

      {/* PDF Viewer Modal */}
      {showPdfViewer && script.pdfUrl && (
        <PdfViewer
          pdfUrl={script.pdfUrl}
          title={script.title}
          onClose={() => setShowPdfViewer(false)}
        />
      )}
    </div>
  );
}

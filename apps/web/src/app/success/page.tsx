'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const scriptId = searchParams.get('scriptId');
  const title = searchParams.get('title');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Script Submitted!
        </h1>

        {/* Message */}
        <p className="text-gray-400 mb-2">
          Your script has been successfully uploaded.
        </p>
        {title && (
          <p className="text-white font-semibold text-lg mb-8">
            "{title}"
          </p>
        )}

        {/* Info Box */}
        <div className="bg-gray-900 rounded-lg p-4 mb-8 border border-gray-800">
          <p className="text-gray-400 text-sm">
            Your script is now live and visible to all users. You can view and manage it from the home page.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {scriptId && (
            <Link
              href={`/script?id=${scriptId}`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              View Your Script
            </Link>
          )}
          <Link
            href="/"
            className="block w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

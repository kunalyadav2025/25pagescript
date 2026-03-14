'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ScriptDetail from '@/components/ScriptDetail';
import Link from 'next/link';

function ScriptPageContent() {
  const searchParams = useSearchParams();
  const scriptId = searchParams.get('id');

  if (!scriptId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-red-400">No script ID provided</div>
        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return <ScriptDetail scriptId={scriptId} />;
}

export default function ScriptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      }
    >
      <ScriptPageContent />
    </Suspense>
  );
}

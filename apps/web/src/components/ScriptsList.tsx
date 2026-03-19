'use client';

import { useEffect, useState } from 'react';
import { Script, Genre, ContentType } from '@/types';
import ScriptCard from './ScriptCard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.25pagescript.com';

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  scripts: 'scripts',
  plots: 'plots',
  screenplay: 'screenplays',
  jokes: 'jokes',
};

interface ScriptsListProps {
  genre?: Genre | null;
  contentType?: ContentType;
}

export default function ScriptsList({ genre, contentType = 'scripts' }: ScriptsListProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScripts() {
      setLoading(true);
      setError(null);
      try {
        const url = genre
          ? `${API_BASE_URL}/scripts?genre=${encodeURIComponent(genre)}`
          : `${API_BASE_URL}/scripts`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch scripts');
        }
        const data = await response.json();
        setScripts(data.scripts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scripts');
      } finally {
        setLoading(false);
      }
    }

    fetchScripts();
  }, [genre]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (scripts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">No {CONTENT_TYPE_LABELS[contentType]} found. Be the first to upload!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scripts.map((script) => (
        <ScriptCard key={script.scriptId} script={script} />
      ))}
    </div>
  );
}

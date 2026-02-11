'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Script, Genre } from '@25pagescript/shared';
import { apiClient } from '@/lib/api';
import { Header, GenreFilter, ScriptCard, LoadingSpinner } from '@/components';

export default function HomePage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScripts = useCallback(
    async (pageNum: number, genre: Genre | null, replace = false) => {
      try {
        const response = await apiClient.getScripts({
          genre: genre || undefined,
          page: pageNum,
          limit: 10,
        });

        if (replace) {
          setScripts(response.scripts);
        } else {
          setScripts((prev) => [...prev, ...response.scripts]);
        }

        setHasMore(response.hasMore);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load scripts';
        setError(message);
      }
    },
    []
  );

  // Initial load and genre change
  useEffect(() => {
    setLoading(true);
    setPage(1);
    loadScripts(1, selectedGenre, true).finally(() => setLoading(false));
  }, [selectedGenre, loadScripts]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    await loadScripts(nextPage, selectedGenre);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleGenreSelect = (genre: Genre | null) => {
    setSelectedGenre(genre);
  };

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        if (!loadingMore && hasMore && !loading) {
          handleLoadMore();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, loading, page, selectedGenre]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="w-full max-w-6xl mx-auto px-4 md:px-8">
        <GenreFilter
          selectedGenre={selectedGenre}
          onSelectGenre={handleGenreSelect}
        />

        {/* Error State */}
        {error && !loading && (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-error/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-error font-medium mb-2">{error}</p>
              {error.includes('connect') && (
                <p className="text-text-secondary text-sm mb-4">
                  Make sure the backend is running:<br />
                  <code className="bg-secondary-bg px-2 py-1 rounded text-xs">npm run backend:offline</code>
                </p>
              )}
              <button
                onClick={() => {
                  setLoading(true);
                  loadScripts(1, selectedGenre, true).finally(() => setLoading(false));
                }}
                className="px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/90"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-16 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-text-secondary">Loading scripts...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && scripts.length === 0 && (
          <div className="p-16 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">No Scripts Found</h2>
            <p className="text-text-secondary mb-6">
              {selectedGenre
                ? `No ${selectedGenre} scripts available yet`
                : 'Be the first to upload a script!'}
            </p>
            <a
              href="/upload"
              className="inline-block px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90"
            >
              Upload Script
            </a>
          </div>
        )}

        {/* Script List */}
        {!loading && !error && scripts.length > 0 && (
          <div>
            {scripts.map((script) => (
              <ScriptCard key={script.scriptId} script={script} />
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="p-8 text-center">
                {loadingMore ? (
                  <LoadingSpinner />
                ) : (
                  <button
                    onClick={handleLoadMore}
                    className="text-accent font-medium hover:underline"
                  >
                    Load more scripts
                  </button>
                )}
              </div>
            )}

            {/* End of list */}
            {!hasMore && scripts.length > 0 && (
              <div className="p-8 text-center text-text-muted text-sm">
                You've reached the end
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

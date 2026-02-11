'use client';

import { GENRES, type Genre } from '@25pagescript/shared';

interface GenreFilterProps {
  selectedGenre: Genre | null;
  onSelectGenre: (genre: Genre | null) => void;
}

export default function GenreFilter({ selectedGenre, onSelectGenre }: GenreFilterProps) {
  return (
    <div className="py-4 border-b border-border overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-4 md:px-8 min-w-max">
          <button
            onClick={() => onSelectGenre(null)}
            className={`px-5 py-2.5 rounded-full text-base font-medium transition-colors whitespace-nowrap ${
              selectedGenre === null
                ? 'bg-foreground text-background'
                : 'bg-secondary-bg text-foreground hover:bg-divider'
            }`}
          >
            All
          </button>
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => onSelectGenre(genre)}
              className={`px-5 py-2.5 rounded-full text-base font-medium transition-colors whitespace-nowrap ${
                selectedGenre === genre
                  ? 'bg-foreground text-background'
                  : 'bg-secondary-bg text-foreground hover:bg-divider'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

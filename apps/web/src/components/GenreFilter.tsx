'use client';

import { Genre, GENRES } from '@/types';

interface GenreFilterProps {
  selectedGenre: Genre | null;
  onGenreChange: (genre: Genre | null) => void;
}

export default function GenreFilter({ selectedGenre, onGenreChange }: GenreFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mb-8">
      <button
        onClick={() => onGenreChange(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selectedGenre === null
            ? 'bg-white text-black'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
      >
        All
      </button>
      {GENRES.map((genre) => (
        <button
          key={genre}
          onClick={() => onGenreChange(genre)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedGenre === genre
              ? 'bg-white text-black'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}

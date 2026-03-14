'use client';

import { useState } from 'react';
import { Genre } from '@/types';
import GenreFilter from './GenreFilter';
import ScriptsList from './ScriptsList';

export default function HomeContent() {
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);

  return (
    <>
      {/* Genre Filter */}
      <GenreFilter selectedGenre={selectedGenre} onGenreChange={setSelectedGenre} />

      {/* Scripts Grid */}
      <ScriptsList genre={selectedGenre} />
    </>
  );
}

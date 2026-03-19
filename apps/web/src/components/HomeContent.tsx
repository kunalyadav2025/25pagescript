'use client';

import { useState } from 'react';
import { Genre, ContentType } from '@/types';
import ContentTypeFilter from './ContentTypeFilter';
import GenreFilter from './GenreFilter';
import ScriptsList from './ScriptsList';

export default function HomeContent() {
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('scripts');
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);

  return (
    <>
      {/* Content Type Filter */}
      <ContentTypeFilter selectedType={selectedContentType} onTypeChange={setSelectedContentType} />

      {/* Genre Filter */}
      <GenreFilter selectedGenre={selectedGenre} onGenreChange={setSelectedGenre} />

      {/* Scripts Grid */}
      <ScriptsList genre={selectedGenre} contentType={selectedContentType} />
    </>
  );
}

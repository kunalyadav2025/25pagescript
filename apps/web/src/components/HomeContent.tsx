'use client';

import { useState } from 'react';
import { Genre, ContentType } from '@/types';
import ContentTypeFilter from './ContentTypeFilter';
import GenreFilter from './GenreFilter';
import ScriptsList from './ScriptsList';

export default function HomeContent() {
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('scripts');
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);

  const handleContentTypeChange = (type: ContentType) => {
    setSelectedContentType(type);
    // Reset genre filter when switching away from scripts
    if (type !== 'scripts') {
      setSelectedGenre(null);
    }
  };

  return (
    <>
      {/* Content Type Filter */}
      <ContentTypeFilter selectedType={selectedContentType} onTypeChange={handleContentTypeChange} />

      {/* Genre Filter - only show for Scripts */}
      {selectedContentType === 'scripts' && (
        <GenreFilter selectedGenre={selectedGenre} onGenreChange={setSelectedGenre} />
      )}

      {/* Content Grid */}
      <ScriptsList genre={selectedGenre} contentType={selectedContentType} />
    </>
  );
}

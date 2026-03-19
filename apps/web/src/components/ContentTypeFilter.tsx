'use client';

import { ContentType, CONTENT_TYPES } from '@/types';

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  scripts: 'Scripts',
  plots: 'Plots',
  screenplay: 'ScreenPlay',
  jokes: 'Jokes',
};

interface ContentTypeFilterProps {
  selectedType: ContentType;
  onTypeChange: (type: ContentType) => void;
}

export default function ContentTypeFilter({ selectedType, onTypeChange }: ContentTypeFilterProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-start">
      {CONTENT_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => onTypeChange(type)}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            selectedType === type
              ? 'bg-white text-black'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {CONTENT_TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  );
}

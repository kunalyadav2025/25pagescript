import { HomeContent } from '@/components';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content Type Filter, Genre Filter & Scripts Grid */}
        <HomeContent />
      </div>
    </div>
  );
}

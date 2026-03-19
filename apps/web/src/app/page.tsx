import { HomeContent } from '@/components';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm">Share a powerful and engaging scripts</p>
        </div>

        {/* Genre Filter & Scripts Grid */}
        <HomeContent />
      </div>
    </div>
  );
}

import { HomeContent } from '@/components';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Share a powerful and engaging scripts</h1>
          <p className="text-gray-400 text-lg">Browse and read scripts from talented writers</p>
        </div>

        {/* Genre Filter & Scripts Grid */}
        <HomeContent />
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface InlinePdfViewerProps {
  pdfUrl: string;
  fontScale?: number;
}

export default function InlinePdfViewer({ pdfUrl, fontScale = 1.0 }: InlinePdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    if (!pdfUrl) {
      setError('No PDF URL provided');
      setLoading(false);
    }
  }, [pdfUrl]);

  // Handle responsive width
  useEffect(() => {
    const updateWidth = () => {
      const width = Math.min(800, window.innerWidth - 64);
      setContainerWidth(width);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setError(`Failed to load PDF: ${error.message}`);
    setLoading(false);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
      </div>
    );
  }

  // Calculate scaled width based on font scale
  const scaledWidth = Math.round(containerWidth * fontScale);

  return (
    <div className="flex flex-col items-center">
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black dark:border-white mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading script...</p>
        </div>
      )}

      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={null}
        error={null}
        className={loading ? 'hidden' : 'space-y-6'}
      >
        {Array.from(new Array(numPages), (_, index) => (
          <div key={`page_${index + 1}`} className="relative">
            {/* Page number indicator */}
            <div className="text-center text-xs text-blue-500 dark:text-blue-400 font-semibold uppercase tracking-wider mb-3">
              Page {index + 1} of {numPages}
            </div>
            <Page
              pageNumber={index + 1}
              className="shadow-xl rounded-lg overflow-hidden"
              renderTextLayer={true}
              renderAnnotationLayer={true}
              width={scaledWidth}
            />
            {/* Divider between pages */}
            {index < numPages - 1 && (
              <div className="border-b border-gray-200 dark:border-gray-800 mt-6" />
            )}
          </div>
        ))}
      </Document>

      {/* Bottom padding */}
      {!loading && numPages > 0 && (
        <div className="py-8 text-center text-gray-600 dark:text-gray-500 text-sm">
          End of script
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { pdfjs } from 'react-pdf';
import LoadingSpinner from './LoadingSpinner';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl: string;
  fontSize: 'normal' | 'large' | 'xlarge';
}

interface PageContent {
  pageNumber: number;
  text: string;
}

const FONT_SIZES: Record<string, { text: string; lineHeight: string }> = {
  normal: { text: '1.125rem', lineHeight: '1.9' },
  large: { text: '1.35rem', lineHeight: '1.9' },
  xlarge: { text: '1.5rem', lineHeight: '1.9' },
};

export default function PDFViewer({ pdfUrl, fontSize }: PDFViewerProps) {
  const [pages, setPages] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPDF() {
      try {
        setLoading(true);
        setError(null);

        const pdf = await pdfjs.getDocument(pdfUrl).promise;
        const pageContents: PageContent[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();

          // Extract text and flow it as paragraphs
          const paragraphs: string[] = [];
          let currentParagraph = '';
          let lastY: number | null = null;

          textContent.items.forEach((item: any) => {
            if (!item.str && item.str !== '') return;
            const y = item.transform[5];

            if (lastY !== null) {
              const yDiff = Math.abs(y - lastY);
              // Large gap = new paragraph, small gap = continue flowing text
              if (yDiff > 15) {
                // New paragraph
                if (currentParagraph.trim()) {
                  paragraphs.push(currentParagraph.trim());
                }
                currentParagraph = item.str;
              } else if (yDiff > 2) {
                // New line but same paragraph - add space and continue
                currentParagraph += ' ' + item.str;
              } else {
                // Same line - just append
                currentParagraph += item.str;
              }
            } else {
              currentParagraph = item.str;
            }
            lastY = y;
          });

          if (currentParagraph.trim()) {
            paragraphs.push(currentParagraph.trim());
          }

          pageContents.push({
            pageNumber: i,
            text: paragraphs.join('\n\n'),
          });
        }

        setPages(pageContents);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setError('Failed to load script. Please try again.');
        setLoading(false);
      }
    }

    loadPDF();
  }, [pdfUrl]);

  const fontStyle = FONT_SIZES[fontSize] || FONT_SIZES.normal;

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center border-b border-border">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-text-secondary text-lg">Loading script...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center border-b border-border">
        <p className="text-error text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="border-b border-border">
      {pages.map((page) => (
        <div
          key={page.pageNumber}
          className="p-5 md:p-8 border-b border-divider last:border-b-0"
        >
          <p className="text-base font-bold uppercase tracking-wider text-accent mb-6 text-center">
            Page {page.pageNumber} of {pages.length}
          </p>
          <div
            className="text-foreground"
            style={{
              fontSize: fontStyle.text,
              lineHeight: fontStyle.lineHeight,
              fontFamily: 'Georgia, "Times New Roman", Times, serif',
            }}
          >
            {page.text.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="mb-4 text-justify">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

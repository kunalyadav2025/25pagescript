import type { Metadata } from 'next';
import { ThemeProvider } from '@/context/ThemeContext';
import './globals.css';

export const metadata: Metadata = {
  title: '25PageScript - Discover & Share Film Scripts',
  description: 'A platform for writers to share short, powerful & engaging film scripts (up to 25 pages) and for readers to discover new stories.',
  keywords: ['film scripts', 'screenwriting', 'short scripts', 'indian cinema', 'script sharing'],
  authors: [{ name: '25PageScript' }],
  openGraph: {
    title: '25PageScript - Discover & Share Film Scripts',
    description: 'Share short, powerful & engaging scripts',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

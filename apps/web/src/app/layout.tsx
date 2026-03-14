import './globals.css';
import { Header } from '@/components';

export const metadata = {
  title: '25PageScript',
  description: 'Discover and Share Film Scripts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}

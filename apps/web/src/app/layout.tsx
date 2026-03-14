import './globals.css';
import { Header } from '@/components';
import Providers from '@/components/Providers';

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
    <html lang="en" className="dark">
      <body>
        <Providers>
          <Header />
          <main className="pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

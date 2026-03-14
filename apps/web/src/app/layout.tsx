import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}

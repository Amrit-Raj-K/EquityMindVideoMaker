import './globals.css';

export const metadata = {
  title: 'AI Market Video Engine',
  description: 'Auto-generate market update videos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import Nav from '@/components/Nav';
import '@/app/globals.css';

export const metadata = { title: 'Onboardr • Soro', description: 'AI-powered Soroswap dashboard' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100">
        <Nav />
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
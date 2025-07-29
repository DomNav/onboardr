import Nav from '@/components/Nav';
import '@/app/globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

export const metadata = { title: 'Onboardr • Soro', description: 'AI-powered Soroswap dashboard' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-zinc-950 text-zinc-100">
        <ThemeProvider attribute="class" defaultTheme="dark">
          <Nav />
          <main className="p-6">{children}</main>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
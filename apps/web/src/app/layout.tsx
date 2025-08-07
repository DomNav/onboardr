import Nav from '@/components/Nav';
import '@/app/globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { TradeSimulationProvider } from '@/contexts/TradeSimulationContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import TradesDrawer from '@/components/TradesDrawer';
import TradesSubscription from '@/components/TradesSubscription';
import TradesDemoHelper from '@/components/TradesDemoHelper';
import TxCenter from '@/components/TxCenter';
import { Providers } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { SoroProvider } from '@/components/providers/SoroProvider';
import { OrchestrationProvider } from '@/components/providers/OrchestrationProvider';

export const metadata = { title: 'Onboardr • Soro', description: 'AI-powered Soroswap dashboard' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body style={{ '--nav-height': '72px' } as React.CSSProperties}>
        <Providers>
          <QueryProvider>
            <ThemeProvider attribute="class" defaultTheme="dark">
              <WalletProvider>
                <CurrencyProvider>
                  <TradeSimulationProvider>
                    <OrchestrationProvider>
                      <Nav />
                      <main className="p-6">{children}</main>
                      <TradesDrawer />
                      <TradesSubscription />
                      <TradesDemoHelper />
                      <TxCenter />
                      <SoroProvider />
                      <Toaster position="top-right" />
                    </OrchestrationProvider>
                  </TradeSimulationProvider>
                </CurrencyProvider>
              </WalletProvider>
            </ThemeProvider>
          </QueryProvider>
        </Providers>
      </body>
    </html>
  );
}
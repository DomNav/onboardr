'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { PillButton, PillContainer } from '@/components/ui/pill-button';
import { Activity, DollarSign, Zap } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { MetricChartSection, ChartLoader } from './ChartComponents';
import { TokenPriceTable } from './TokenPriceTable';
import { PairVolumePieChart } from './PairVolumePieChart';
import { ErrorState } from './ErrorState';
import { ConsentBanner } from './ConsentBanner';
import { useAnalyticsPerformance } from '@/hooks/useAnalyticsPerformance';
import { TimeFrame, Metric } from '@/types/analytics';
import { FloatingSoroButton } from '@/components/FloatingSoroButton';
import { SoroSlideOver } from '@/components/SoroSlideOver';

// Helper components
const PageHeader = () => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center gap-3">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Analytics Dashboard
      </h1>
      <Badge variant="outline" className="text-sm">
        Live
      </Badge>
    </div>
  </div>
);

interface TimeframeSwitcherProps {
  timeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
}

const TimeframeSwitcher: React.FC<TimeframeSwitcherProps> = ({
  timeFrame,
  onTimeFrameChange
}) => (
  <PillContainer>
    {(["24h", "7d", "30d"] as const).map((period) => (
      <PillButton
        key={period}
        active={timeFrame === period}
        onClick={() => onTimeFrameChange(period)}
        aria-pressed={timeFrame === period}
        aria-label={`Select ${period} time frame`}
      >
        {period}
      </PillButton>
    ))}
  </PillContainer>
);

interface MetricTabsProps {
  metric: Metric;
  onMetricChange: (metric: Metric) => void;
}

const MetricTabs: React.FC<MetricTabsProps> = ({
  metric,
  onMetricChange
}) => {
  const metricConfig = {
    volume: { icon: Activity, label: 'Volume' },
    tvl: { icon: DollarSign, label: 'TVL' },
    fees: { icon: Zap, label: 'Fees' }
  };

  return (
    <PillContainer>
      {(["volume", "tvl", "fees"] as const).map((metricKey) => {
        const config = metricConfig[metricKey];
        const Icon = config.icon;
        
        return (
          <PillButton
            key={metricKey}
            active={metric === metricKey}
            onClick={() => onMetricChange(metricKey)}
            aria-pressed={metric === metricKey}
            aria-label={`Select ${config.label} metric`}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{config.label}</span>
            <span className="sm:hidden">{config.label.charAt(0)}</span>
          </PillButton>
        );
      })}
    </PillContainer>
  );
};

// Container component with responsive max-width
const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div 
    className="min-h-screen bg-background"
    style={{ paddingTop: 'var(--nav-height, 72px)' }}
  >
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {children}
    </div>
  </div>
);

// This ErrorState component has been moved to ./ErrorState.tsx for better organization

export const AnalyticsDashboardPage: React.FC = () => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("24h");
  const [metric, setMetric] = useState<Metric>("volume");
  const [isSoroOpen, setIsSoroOpen] = useState(false);

  const { data, isLoading, error, mutate } = useDashboardData(timeFrame);
  const performance = useAnalyticsPerformance(timeFrame);

  const metricConfig = {
    volume: { icon: <Activity className="h-4 w-4" />, label: 'Volume' },
    tvl: { icon: <DollarSign className="h-4 w-4" />, label: 'TVL' },
    fees: { icon: <Zap className="h-4 w-4" />, label: 'Fees' }
  };

  return (
    <Container>
      <PageHeader />
      
      {/* Controls - Miller's Law Compliance: Max 5 primary actions on screen
          Currently showing: 3 timeframe buttons + 3 metric buttons = 6 total
          But grouped into 2 logical sets, so cognitively processed as 2 units */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <label className="sr-only" htmlFor="timeframe-controls">Select time frame</label>
          <TimeframeSwitcher 
            timeFrame={timeFrame} 
            onTimeFrameChange={setTimeFrame} 
          />
        </div>
        <div>
          <label className="sr-only" htmlFor="metric-controls">Select metric type</label>
          <MetricTabs 
            metric={metric} 
            onMetricChange={setMetric} 
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState error={error} onRetry={mutate} />
      )}

      {/* Loading State */}
      {isLoading && !data && (
        <div className="h-96 flex items-center justify-center">
          <ChartLoader />
        </div>
      )}

      {/* Main Content */}
      {data && !error && (
        <>
          {/* Charts Section */}
          <div className="mb-8">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-6">
                {metricConfig[metric].label} Analytics ({timeFrame})
              </h2>
              <MetricChartSection
                metric={metric}
                data={data[`${metric}Chart`]}
                timeFrame={timeFrame}
                icon={metricConfig[metric].icon}
              />
            </div>
          </div>

          {/* Token & Pair Data Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Token Price Table */}
            <section className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" id="token-prices-heading">
                <Activity className="h-5 w-5" aria-hidden="true" />
                Token Prices
              </h2>
              <div className="overflow-x-auto">
                <TokenPriceTable data={data.tokenPrices} />
              </div>
            </section>
            
            {/* Pair Volume Pie Chart */}
            <section className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" id="volume-distribution-heading">
                <DollarSign className="h-5 w-5" aria-hidden="true" />
                Volume Distribution
              </h2>
              <PairVolumePieChart data={data.pairVolumes} />
            </section>
          </div>
        </>
      )}

      {/* Data attribution */}
      {data && (
        <div className="mt-8 text-center text-xs text-muted-foreground">
          Data updated {new Date(data.lastUpdated).toLocaleTimeString()} • 
          Updates every 30 seconds • Powered by Stellar DEX
        </div>
      )}

      {/* PIPEDA Consent Banner (Canadian Compliance) */}
      <ConsentBanner />

      {/* Floating Soro Trading Widget */}
      <FloatingSoroButton onClick={() => setIsSoroOpen(true)} />
      <SoroSlideOver 
        isOpen={isSoroOpen} 
        onClose={() => setIsSoroOpen(false)} 
      />
    </Container>
  );
};
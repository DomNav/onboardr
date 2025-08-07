import React, { useMemo, useState, lazy, Suspense, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Zap,
  X as Close,
  ExternalLink,
  BarChart3
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  generateMockData,
  generateWeeklyData,
  generateMonthlyData,
  topTokenPairs,
  pieData,
  calculatePercentageChange,
  formatLargeNumber,
} from "@/lib/mock/metrics.dev";

// Lazy-load heavy chart bundle to keep initial bundle size down
const LineChartComponent = lazy(() => 
  import("recharts").then(module => ({ 
    default: ({ data, color }: { data: any[], color: string }) => {
      const { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } = module;
      
      // Detect dark mode from document
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#d1d5db' : '#666';
      const bgColor = isDark ? '#374151' : 'white';
      const borderColor = isDark ? '#4b5563' : 'var(--soro-border-light)';
      
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data}
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: textColor }}
              height={40}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: textColor }}
              domain={['dataMin - 10', 'dataMax + 10']}
              width={60}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
                color: textColor
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={3}
              dot={false}
              activeDot={{ 
                r: 5, 
                fill: color,
                strokeWidth: 2,
                stroke: bgColor
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  }))
);

const PieChartComponent = lazy(() => 
  import("recharts").then(module => ({ 
    default: ({ data }: { data: any[] }) => {
      const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } = module;
      
      // Detect dark mode from document
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#d1d5db' : '#666';
      const bgColor = isDark ? '#374151' : 'white';
      const borderColor = isDark ? '#4b5563' : 'var(--soro-border-light)';
      
                                                       return (
           <ResponsiveContainer width="100%" height="100%">
             <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
               <Pie
                 data={data}
                 cx="50%"
                 cy="50%"
                 innerRadius={28}
                 outerRadius={60}
                 paddingAngle={2}
                 dataKey="value"
               >
                 {data.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.color}>
                    <Label
                      content={({ viewBox, percent, ...props }: any) => {
                        const { cx, cy, midAngle, innerRadius, outerRadius } = viewBox;
                        const RADIAN = Math.PI / 180;
                        // Position label at half radius
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill={textColor}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="10"
                            fontWeight="500"
                          >
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                    />
                  </Cell>
                 ))}
               </Pie>
               <Tooltip
                 formatter={(value: number, name: string, props: any) => [
                   <span key="value" style={{ color: textColor, fontWeight: 'bold' }}>{value}%</span>,
                   <span key="label" style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '11px' }}>Share</span>
                 ]}
                 labelFormatter={(name: string) => (
                   <span style={{ color: textColor, fontWeight: 'bold' }}>{name}</span>
                 )}
                 contentStyle={{
                   backgroundColor: bgColor,
                   border: `1px solid ${borderColor}`,
                   borderRadius: '8px',
                   fontSize: '12px',
                   color: textColor,
                   boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                 }}
               />
             </PieChart>
           </ResponsiveContainer>
         );
    }
  }))
);

// Types
type TimeFrame = "24h" | "7d" | "30d";
type Metric = "volume" | "tvl" | "fees";

// Helper component for loading state
const ChartLoader = () => (
  <div className="h-full w-full flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
  </div>
);

// Helper function to format tooltip values
const formatTooltipValue = (value: number, metric: Metric): string => {
  return metric === "volume"
    ? formatLargeNumber(value * 1_000)
    : metric === "tvl"
    ? formatLargeNumber(value * 10_000)
    : `$${value.toFixed(2)}`;
};

interface MetricsCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<Metric>("volume");
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("24h");
  const reducedMotion = useReducedMotion();

  // Handle escape key to close panel
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // One-time data generation (memoised for performance)
  const chartData = useMemo(
    () => ({
      "24h": generateMockData(24),
      "7d": generateWeeklyData(),
      "30d": generateMonthlyData()
    }),
    []
  );

  // Helper mappings
  const chartColor: Record<Metric, string> = {
    volume: "var(--soro-chart-volume)",
    tvl: "var(--soro-chart-tvl)",
    fees: "var(--soro-chart-fees)"
  };

  const labelIcon: Record<Metric, JSX.Element> = {
    volume: <Activity className="h-4 w-4" />,
    tvl: <DollarSign className="h-4 w-4" />,
    fees: <Zap className="h-4 w-4" />
  };

  const getLatestValue = (metric: Metric): string => {
    const latest = chartData[timeFrame].at(-1)?.value ?? 0;
    return metric === "volume"
      ? formatLargeNumber(latest * 1_000)
      : metric === "tvl"
      ? formatLargeNumber(latest * 10_000)
      : `$${latest.toFixed(2)}`;
  };

  const getPercentageChange = (metric: Metric): number => {
    const series = chartData[timeFrame];
    if (series.length < 2) return 0;
    const current = series.at(-1)!.value;
    const previous = series.at(-2)!.value;
    return calculatePercentageChange(current, previous);
  };

  const getPeakValue = (metric: Metric): string => {
    const series = chartData[timeFrame];
    const peak = Math.max(...series.map(d => d.value));
    return metric === "volume"
      ? formatLargeNumber(peak * 1_000)
      : metric === "tvl"
      ? formatLargeNumber(peak * 10_000)
      : `$${peak.toFixed(2)}`;
  };

  const getLowValue = (metric: Metric): string => {
    const series = chartData[timeFrame];
    const low = Math.min(...series.map(d => d.value));
    return metric === "volume"
      ? formatLargeNumber(low * 1_000)
      : metric === "tvl"
      ? formatLargeNumber(low * 10_000)
      : `$${low.toFixed(2)}`;
  };

  const formatTooltipValue = (value: number, metric: Metric): string => {
    return metric === "volume"
      ? formatLargeNumber(value * 1_000)
      : metric === "tvl"
      ? formatLargeNumber(value * 10_000)
      : `$${value.toFixed(2)}`;
  };

  // Chart loading fallback
  const ChartLoader = () => (
    <div className="h-56 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <BarChart3 className="h-4 w-4 animate-pulse" />
        Loading chart...
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for click-outside functionality */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
            aria-hidden="true"
          />
          
          {/* Analytics Panel */}
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{
              type: reducedMotion ? "tween" : "spring",
              duration: reducedMotion ? 0.2 : 0.35,
              stiffness: 220,
              damping: 25
            }}
            aria-label="Soro analytics dashboard panel"
            className="fixed right-0 top-0 bottom-0 z-40 w-[420px] max-w-[90vw] shadow-2xl"
            style={{ paddingTop: 'var(--nav-height, 72px)' }}
          >
          <Card className="h-full rounded-none rounded-l-xl border-r-0 bg-white dark:bg-gray-900 flex flex-col" style={{ height: 'calc(100vh - var(--nav-height, 72px))' }}>
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-soro-border-subtle">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Dashboard</h2>
                <Badge variant="outline" className="text-xs">Live</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close analytics panel"
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Close className="h-4 w-4" />
              </Button>
            </CardHeader>

            {/* Content */}
            <CardContent className="pt-6 overflow-y-auto flex-1 space-y-6" style={{ height: 'calc(100% - 80px)' }}>
              {/* Timeframe filter */}
              <div className="flex gap-2">
                {(["24h", "7d", "30d"] as const).map((period) => (
                  <Button
                    key={period}
                    variant={timeFrame === period ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeFrame(period)}
                    className={cn(
                      "text-xs",
                      timeFrame === period
                        ? "bg-soro-primary text-white"
                        : "border-soro-border-light hover:bg-soro-primary/5"
                    )}
                  >
                    {period}
                  </Button>
                ))}
              </div>

              {/* Main Metrics Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Metric)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  {(["volume", "tvl", "fees"] as const).map((metric) => (
                    <TabsTrigger
                      key={metric}
                      value={metric}
                      className="flex items-center gap-1 text-sm"
                    >
                      {labelIcon[metric]}
                      {metric.toUpperCase()}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {(["volume", "tvl", "fees"] as const).map((metric) => (
                  <TabsContent key={metric} value={metric} className="mt-0">
                    <motion.div
                      initial={{ rotateX: 90, opacity: 0 }}
                      animate={{ rotateX: 0, opacity: 1 }}
                      transition={{ 
                        duration: reducedMotion ? 0 : 0.55,
                        ease: "easeOut"
                      }}
                      className="space-y-6"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* Metrics Summary Card */}
                      <div className="p-4 rounded-lg bg-soro-highlight border border-soro-border-light">
                        <div className="flex items-center gap-2 mb-2">
                          {labelIcon[metric]}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {timeFrame} {metric} {metric === 'tvl' ? 'locked' : 'activity'}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {getLatestValue(metric)}
                          </span>
                          <div className={cn(
                            "flex items-center gap-1 text-sm",
                            getPercentageChange(metric) >= 0
                              ? "text-soro-success"
                              : "text-soro-error"
                          )}>
                            {getPercentageChange(metric) >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {getPercentageChange(metric) >= 0 ? "+" : ""}
                            {getPercentageChange(metric).toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      {/* Main Chart */}
                      <div className="h-56 w-full p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                        <Suspense fallback={<ChartLoader />}>
                          <LineChartComponent 
                            data={chartData[timeFrame]} 
                            color={chartColor[metric]} 
                          />
                        </Suspense>
                      </div>

                      {/* Additional Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Peak {timeFrame}</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {getPeakValue(metric)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Low {timeFrame}</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {getLowValue(metric)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </TabsContent>
                ))}
              </Tabs>

                             {/* Trading Pairs & Volume Distribution Combined */}
               <div className="space-y-4">
                 <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                   <Activity className="h-4 w-4" />
                   Trading Pairs & Volume Distribution
                 </h3>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                   {/* Top Trading Pairs List */}
                   <div className="space-y-2">
                     {topTokenPairs.map((pair, index) => (
                       <motion.div
                         key={pair.pair}
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: index * 0.1 }}
                         className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                       >
                         <div className="flex items-center gap-3">
                           <div 
                             className="w-3 h-3 rounded-full"
                             style={{ backgroundColor: pair.color }}
                           />
                           <span className="text-sm font-medium text-gray-900 dark:text-white">{pair.pair}</span>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-semibold text-gray-900 dark:text-white">{pair.volume}</p>
                           <p className={cn(
                             "text-xs font-medium",
                             pair.change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                           )}>
                             {pair.change >= 0 ? '+' : ''}{pair.change}%
                           </p>
                         </div>
                       </motion.div>
                     ))}
                   </div>

                   {/* Volume Distribution Pie Chart */}
                   <div className="h-48 w-full p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                     <Suspense fallback={<ChartLoader />}>
                       <PieChartComponent data={pieData} />
                     </Suspense>
                   </div>
                 </div>
               </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-soro-border-subtle space-y-3">
                {process.env.NEXT_PUBLIC_FEATURE_ANALYTICS_DASHBOARD === 'true' ? (
                  <Link href="/analytics" passHref legacyBehavior>
                    <Button
                      variant="outline"
                      className="w-full justify-start p-3 h-auto text-sm text-soro-primary hover:text-soro-accent-end hover:bg-soro-primary/5"
                      asChild
                    >
                      <a>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Full Dashboard
                      </a>
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    disabled
                    className="w-full justify-start p-3 h-auto text-sm opacity-50"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Full Dashboard (Coming Soon)
                  </Button>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Data updates every 30 seconds • Powered by Stellar DEX
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
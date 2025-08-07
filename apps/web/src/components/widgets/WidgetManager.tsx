/**
 * Widget Manager Component
 * Provides drag-and-drop dashboard with customizable widgets
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, X, Maximize2, Minimize2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { useOrchestration } from '@/hooks/useOrchestration';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Import widget components
import { MetricsSummaryWidget } from './widgets/MetricsSummaryWidget';
import { PoolPerformanceWidget } from './widgets/PoolPerformanceWidget';
import { VaultOptimizerWidget } from './widgets/VaultOptimizerWidget';
import { TradeQueueWidget } from './widgets/TradeQueueWidget';
import { PortfolioOverviewWidget } from './widgets/PortfolioOverviewWidget';
import { PriceChartWidget } from './widgets/PriceChartWidget';
import { AlertsWidget } from './widgets/AlertsWidget';
import { NewsWidget } from './widgets/NewsWidget';

// Make grid responsive
const ResponsiveGridLayout = WidthProvider(Responsive);

// Widget types
export type WidgetType = 
  | 'metrics-summary'
  | 'pool-performance'
  | 'vault-optimizer'
  | 'trade-queue'
  | 'portfolio-overview'
  | 'price-chart'
  | 'alerts'
  | 'news';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  minimized?: boolean;
  settings?: any;
}

export interface WidgetLayout extends Layout {
  i: string; // Widget ID
}

// Available widgets catalog
const WIDGET_CATALOG: Record<WidgetType, {
  title: string;
  description: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  component: React.ComponentType<any>;
}> = {
  'metrics-summary': {
    title: 'Metrics Summary',
    description: 'TVL, Volume, and Fees overview',
    defaultSize: { w: 6, h: 2 },
    minSize: { w: 4, h: 2 },
    component: MetricsSummaryWidget,
  },
  'pool-performance': {
    title: 'Top Pools',
    description: 'Best performing liquidity pools',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    component: PoolPerformanceWidget,
  },
  'vault-optimizer': {
    title: 'Vault Optimizer',
    description: 'Compare and analyze vaults',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    component: VaultOptimizerWidget,
  },
  'trade-queue': {
    title: 'Trade Queue',
    description: 'Pending and executed trades',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    component: TradeQueueWidget,
  },
  'portfolio-overview': {
    title: 'Portfolio',
    description: 'Your asset allocation',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 3 },
    component: PortfolioOverviewWidget,
  },
  'price-chart': {
    title: 'Price Chart',
    description: 'Token price movements',
    defaultSize: { w: 8, h: 4 },
    minSize: { w: 6, h: 3 },
    component: PriceChartWidget,
  },
  'alerts': {
    title: 'Alerts',
    description: 'Price and event notifications',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    component: AlertsWidget,
  },
  'news': {
    title: 'News Feed',
    description: 'Latest DeFi news',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    component: NewsWidget,
  },
};

// Default layouts for different screen sizes
const DEFAULT_LAYOUTS = {
  lg: [] as WidgetLayout[],
  md: [] as WidgetLayout[],
  sm: [] as WidgetLayout[],
  xs: [] as WidgetLayout[],
  xxs: [] as WidgetLayout[],
};

interface WidgetManagerProps {
  className?: string;
  editMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
}

export function WidgetManager({ 
  className,
  editMode: controlledEditMode,
  onEditModeChange 
}: WidgetManagerProps) {
  const { preloadedData, isConnected } = useOrchestration();
  const [widgets, setWidgets] = useLocalStorage<WidgetConfig[]>('dashboard-widgets', [
    { id: 'metrics-1', type: 'metrics-summary', title: 'Metrics Summary' },
    { id: 'pools-1', type: 'pool-performance', title: 'Top Pools' },
    { id: 'trades-1', type: 'trade-queue', title: 'Trade Queue' },
  ]);
  
  const [layouts, setLayouts] = useLocalStorage<any>('dashboard-layouts', DEFAULT_LAYOUTS);
  const [editMode, setEditMode] = useState(controlledEditMode ?? false);
  const [showAddWidget, setShowAddWidget] = useState(false);

  // Handle edit mode changes
  useEffect(() => {
    if (controlledEditMode !== undefined) {
      setEditMode(controlledEditMode);
    }
  }, [controlledEditMode]);

  const handleEditModeChange = (mode: boolean) => {
    setEditMode(mode);
    onEditModeChange?.(mode);
  };

  // Handle layout change
  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: any) => {
    setLayouts(allLayouts);
  }, [setLayouts]);

  // Add new widget
  const addWidget = useCallback((type: WidgetType) => {
    const widgetDef = WIDGET_CATALOG[type];
    const newWidget: WidgetConfig = {
      id: `${type}-${Date.now()}`,
      type,
      title: widgetDef.title,
    };

    // Calculate position for new widget
    const newLayout: WidgetLayout = {
      i: newWidget.id,
      x: 0,
      y: 100, // Add at bottom
      ...widgetDef.defaultSize,
      minW: widgetDef.minSize.w,
      minH: widgetDef.minSize.h,
    };

    // Add to all breakpoint layouts
    const updatedLayouts = { ...layouts };
    Object.keys(updatedLayouts).forEach(breakpoint => {
      updatedLayouts[breakpoint] = [...(updatedLayouts[breakpoint] || []), newLayout];
    });

    setWidgets([...widgets, newWidget]);
    setLayouts(updatedLayouts);
    setShowAddWidget(false);
  }, [widgets, layouts, setWidgets, setLayouts]);

  // Remove widget
  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
    
    const updatedLayouts = { ...layouts };
    Object.keys(updatedLayouts).forEach(breakpoint => {
      updatedLayouts[breakpoint] = updatedLayouts[breakpoint].filter(
        (l: WidgetLayout) => l.i !== widgetId
      );
    });
    setLayouts(updatedLayouts);
  }, [widgets, layouts, setWidgets, setLayouts]);

  // Toggle widget minimize
  const toggleMinimize = useCallback((widgetId: string) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, minimized: !w.minimized } : w
    ));
  }, [widgets, setWidgets]);

  // Update widget settings
  const updateWidgetSettings = useCallback((widgetId: string, settings: any) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, settings } : w
    ));
  }, [widgets, setWidgets]);

  // Render individual widget
  const renderWidget = useCallback((widget: WidgetConfig) => {
    const widgetDef = WIDGET_CATALOG[widget.type];
    if (!widgetDef) return null;

    const WidgetComponent = widgetDef.component;

    return (
      <Card
        key={widget.id}
        className={cn(
          'widget-container overflow-hidden',
          'transition-all duration-200',
          editMode && 'ring-2 ring-primary/20 ring-offset-2',
          widget.minimized && 'opacity-75'
        )}
      >
        {/* Widget Header */}
        <div className="widget-header flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            {editMode && (
              <GripVertical className="widget-handle w-4 h-4 text-muted-foreground cursor-move" />
            )}
            <h3 className="text-sm font-medium">{widget.title}</h3>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => toggleMinimize(widget.id)}
            >
              {widget.minimized ? (
                <Maximize2 className="h-3 w-3" />
              ) : (
                <Minimize2 className="h-3 w-3" />
              )}
            </Button>
            
            {editMode && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => removeWidget(widget.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Widget Content */}
        {!widget.minimized && (
          <div className="widget-content p-4">
            <WidgetComponent
              data={preloadedData}
              settings={widget.settings}
              onSettingsChange={(settings: any) => updateWidgetSettings(widget.id, settings)}
            />
          </div>
        )}
      </Card>
    );
  }, [editMode, preloadedData, toggleMinimize, removeWidget, updateWidgetSettings]);

  // Generate layouts for all widgets
  const widgetLayouts = useMemo(() => {
    const layoutMap: Record<string, WidgetLayout[]> = {};
    
    Object.keys(layouts).forEach(breakpoint => {
      layoutMap[breakpoint] = widgets.map(widget => {
        const existing = layouts[breakpoint]?.find((l: WidgetLayout) => l.i === widget.id);
        if (existing) return existing;
        
        // Create default layout for new widget
        const widgetDef = WIDGET_CATALOG[widget.type];
        return {
          i: widget.id,
          x: 0,
          y: 0,
          ...widgetDef.defaultSize,
          minW: widgetDef.minSize.w,
          minH: widgetDef.minSize.h,
        };
      });
    });
    
    return layoutMap;
  }, [widgets, layouts]);

  return (
    <div className={cn('widget-manager', className)}>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        
        <div className="flex items-center gap-2">
          {editMode && (
            <DropdownMenu open={showAddWidget} onOpenChange={setShowAddWidget}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {Object.entries(WIDGET_CATALOG).map(([type, def]) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => addWidget(type as WidgetType)}
                  >
                    <div>
                      <div className="font-medium">{def.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {def.description}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleEditModeChange(!editMode)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {editMode ? 'Done' : 'Edit'}
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={widgetLayouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={editMode}
        isResizable={editMode}
        draggableHandle=".widget-handle"
        containerPadding={[0, 0]}
        margin={[16, 16]}
      >
        {widgets.map(widget => (
          <div key={widget.id}>
            {renderWidget(widget)}
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Empty State */}
      {widgets.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground mb-4">
            No widgets added yet
          </div>
          <Button onClick={() => handleEditModeChange(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Widget
          </Button>
        </Card>
      )}
    </div>
  );
}
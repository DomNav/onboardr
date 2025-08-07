'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { AlertTriangle, Info, Settings } from 'lucide-react';

interface SlippageSettingProps {
  value: number;
  onChange: (value: number) => void;
  showAdvanced?: boolean;
  disabled?: boolean;
  className?: string;
}

interface SlippagePreset {
  label: string;
  value: number;
  description: string;
  risk: 'low' | 'medium' | 'high';
}

const SLIPPAGE_PRESETS: SlippagePreset[] = [
  { label: '0.1%', value: 0.1, description: 'Very conservative, may fail during high volatility', risk: 'low' },
  { label: '0.5%', value: 0.5, description: 'Conservative, suitable for stable pairs', risk: 'low' },
  { label: '1%', value: 1.0, description: 'Balanced, works for most trades', risk: 'medium' },
  { label: '3%', value: 3.0, description: 'Higher tolerance, better for volatile pairs', risk: 'medium' },
  { label: '5%', value: 5.0, description: 'High tolerance, risk of MEV attacks', risk: 'high' },
];

const MAX_SLIPPAGE = 20.0; // 20% maximum
const WARNING_THRESHOLD = 3.0; // Show warning above 3%
const DANGER_THRESHOLD = 10.0; // Show danger above 10%

export function SlippageSetting({ 
  value, 
  onChange, 
  showAdvanced = false, 
  disabled = false,
  className = '' 
}: SlippageSettingProps) {
  const [customValue, setCustomValue] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handlePresetSelect = useCallback((presetValue: number) => {
    setIsCustomMode(false);
    setCustomValue('');
    onChange(presetValue);
  }, [onChange]);

  const handleCustomSubmit = useCallback(() => {
    const numValue = parseFloat(customValue);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= MAX_SLIPPAGE) {
      onChange(numValue);
      setIsCustomMode(false);
      setCustomValue('');
    }
  }, [customValue, onChange]);

  const handleCustomChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(inputValue)) {
      setCustomValue(inputValue);
    }
  }, []);

  const getRiskLevel = useCallback((slippageValue: number): 'low' | 'medium' | 'high' | 'danger' => {
    if (slippageValue >= DANGER_THRESHOLD) return 'danger';
    if (slippageValue >= WARNING_THRESHOLD) return 'high';
    if (slippageValue >= 1.0) return 'medium';
    return 'low';
  }, []);

  const getRiskColor = useCallback((risk: 'low' | 'medium' | 'high' | 'danger') => {
    switch (risk) {
      case 'low': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'danger': return 'text-red-600 dark:text-red-400';
    }
  }, []);

  const currentRisk = getRiskLevel(value);
  const isWarning = value >= WARNING_THRESHOLD;

  return (
    <Card className={`${className} ${disabled ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <CardTitle className="text-base">Slippage Tolerance</CardTitle>
          <div title="Maximum price movement you're willing to accept. Higher values increase success rate but may result in worse prices.">
            <Info className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Setting Display */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div>
            <div className="text-sm font-medium">Current Setting</div>
            <div className={`text-lg font-bold ${getRiskColor(currentRisk)}`}>
              {value.toFixed(1)}%
            </div>
          </div>
          {isWarning && (
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs">High Risk</span>
            </div>
          )}
        </div>

        {/* Preset Buttons */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Settings</Label>
          <div className="grid grid-cols-3 gap-2">
            {SLIPPAGE_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                variant={value === preset.value ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetSelect(preset.value)}
                disabled={disabled}
                className="text-xs"
                title={`${preset.label} Slippage - ${preset.description} - Risk: ${preset.risk.toUpperCase()}`}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Custom Setting</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter custom %"
                value={customValue}
                onChange={handleCustomChange}
                disabled={disabled}
                className="text-sm"
                onFocus={() => setIsCustomMode(true)}
              />
            </div>
            {isCustomMode && customValue && (
              <Button
                size="sm"
                onClick={handleCustomSubmit}
                disabled={disabled || !customValue || isNaN(parseFloat(customValue))}
              >
                Apply
              </Button>
            )}
          </div>
          {isCustomMode && customValue && parseFloat(customValue) > MAX_SLIPPAGE && (
            <div className="text-xs text-red-600 dark:text-red-400">
              Maximum slippage is {MAX_SLIPPAGE}%
            </div>
          )}
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="pt-2 border-t border-border space-y-3">
            <Label className="text-sm font-medium">Advanced Protection</Label>
            
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>MEV Protection</span>
                <span className={value <= 3.0 ? 'text-green-600' : 'text-yellow-600'}>
                  {value <= 3.0 ? 'Enabled' : 'Reduced'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Front-run Risk</span>
                <span className={getRiskColor(currentRisk)}>
                  {currentRisk.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Success Probability</span>
                <span className="text-foreground font-medium">
                  {value <= 0.5 ? '~60%' : value <= 1.0 ? '~80%' : value <= 3.0 ? '~95%' : '~99%'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Risk Warning */}
        {value >= DANGER_THRESHOLD && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-medium text-red-800 dark:text-red-200">
                  Very High Risk
                </div>
                <div className="text-xs text-red-700 dark:text-red-300">
                  Slippage above {DANGER_THRESHOLD}% significantly increases the risk of MEV attacks and poor execution prices. Consider using a lower value.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-xs text-blue-800 dark:text-blue-200">
            <div className="font-medium mb-1">How it works:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>Your trade will revert if the price moves more than this percentage</li>
              <li>Lower values protect against bad prices but may cause trade failures</li>
              <li>Higher values increase success rate but allow worse execution</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SlippageSetting;
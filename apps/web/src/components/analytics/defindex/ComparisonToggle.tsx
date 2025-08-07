'use client';

import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GitCompare } from 'lucide-react';

interface ComparisonToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function ComparisonToggle({ enabled, onToggle }: ComparisonToggleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg"
    >
      <GitCompare className="w-4 h-4 text-muted-foreground" />
      <Label htmlFor="comparison" className="text-sm cursor-pointer">
        Compare with Soroswap
      </Label>
      <Switch
        id="comparison"
        checked={enabled}
        onCheckedChange={onToggle}
      />
    </motion.div>
  );
}
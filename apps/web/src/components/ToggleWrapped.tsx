import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ToggleWrappedProps {
  showWrapped: boolean;
  onToggle: (showWrapped: boolean) => void;
}

export default function ToggleWrapped({ showWrapped, onToggle }: ToggleWrappedProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="wrapped-toggle"
        checked={showWrapped}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="wrapped-toggle" className="text-sm font-medium">
        {showWrapped ? 'Wrapped' : 'Stellar Classic'}
      </Label>
    </div>
  );
} 
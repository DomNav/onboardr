'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Currency, CURRENCIES, POPULAR_CURRENCIES, getCurrencyDisplayText } from '@/lib/currencies';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CurrencyDropdownProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function CurrencyDropdown({ className, variant = 'default' }: CurrencyDropdownProps) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  const handleSelect = (selectedCurrency: Currency) => {
    setCurrency(selectedCurrency);
    setOpen(false);
  };

  if (variant === 'compact') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-medium"
          >
            {currency.symbol} {currency.code}
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="ml-1 h-3 w-3" />
            </motion.div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <CurrencyCommand onSelect={handleSelect} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
                 <Button
           variant="outline"
           role="combobox"
           aria-expanded={open}
           className={`w-full justify-between hover:bg-background hover:text-foreground ${className}`}
         >
          <div className="flex items-center gap-2">
            <span className="text-lg text-foreground">{currency.symbol}</span>
            <div className="text-left">
              <div className="font-medium text-foreground">{currency.code}</div>
              <div className="text-xs text-muted-foreground">{currency.name}</div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </motion.div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <CurrencyCommand onSelect={handleSelect} />
      </PopoverContent>
    </Popover>
  );
}

interface CurrencyCommandProps {
  onSelect: (currency: Currency) => void;
}

function CurrencyCommand({ onSelect }: CurrencyCommandProps) {
  return (
    <Command>
      <CommandInput placeholder="Search currencies..." />
      <CommandList>
        <CommandEmpty>No currency found.</CommandEmpty>
        
        {/* Popular currencies */}
        <CommandGroup heading="Popular">
          {POPULAR_CURRENCIES.map((currency) => (
            <CurrencyCommandItem
              key={currency.code}
              currency={currency}
              onSelect={onSelect}
            />
          ))}
        </CommandGroup>
        
        <CommandGroup heading="All currencies">
          {CURRENCIES.map((currency) => (
            <CurrencyCommandItem
              key={currency.code}
              currency={currency}
              onSelect={onSelect}
            />
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

interface CurrencyCommandItemProps {
  currency: Currency;
  onSelect: (currency: Currency) => void;
}

function CurrencyCommandItem({ currency, onSelect }: CurrencyCommandItemProps) {
  const { currency: selectedCurrency } = useCurrency();
  const isSelected = selectedCurrency.code === currency.code;

  return (
    <CommandItem
      value={`${currency.code} ${currency.name}`}
      onSelect={() => onSelect(currency)}
      className="flex items-center gap-2"
    >
             <div className="flex items-center gap-2 flex-1">
         <span className="text-lg text-foreground">{currency.symbol}</span>
         <div className="flex-1">
           <div className="font-medium text-foreground">{currency.code}</div>
           <div className="text-xs text-muted-foreground">{currency.name}</div>
         </div>
       </div>
      {isSelected && <Check className="h-4 w-4" />}
    </CommandItem>
  );
} 
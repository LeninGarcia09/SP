import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { Input } from './input';
import { cn } from '../../lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Search…',
  className,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = search
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          (o.sublabel?.toLowerCase().includes(search.toLowerCase()) ?? false),
      )
    : options;

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setSearch('');
  }

  function handleClear() {
    onChange('');
    setSearch('');
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
          <Input
            ref={inputRef}
            value={open ? search : selected?.label ?? ''}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!open) setOpen(true);
            }}
            onClick={() => { if (!open) setOpen(true); }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
                inputRef.current?.blur();
              }
            }}
            className={cn(
              !open && value && 'text-foreground',
              value && !open && 'pr-8',
            )}
          />
          {value && !open && !disabled && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              tabIndex={-1}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="max-h-60 overflow-y-auto p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No matches found
          </div>
        )}

        {filtered.map((o) => (
          <button
            key={o.value}
            type="button"
            className={cn(
              'w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between border-b border-border/40 last:border-0 transition-colors',
              o.value === value && 'bg-accent text-accent-foreground font-medium',
            )}
            onMouseDown={(e) => { e.preventDefault(); handleSelect(o.value); }}
          >
            <span className="text-foreground">{o.label}</span>
            {o.sublabel && (
              <span className="text-xs text-muted-foreground ml-2 truncate">
                {o.sublabel}
              </span>
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

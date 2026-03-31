import { useState, useRef } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
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
              'pr-14',
              !open && value && 'text-foreground',
            )}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {value && !open && !disabled && (
              <button
                type="button"
                className="p-0.5 rounded-sm text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                tabIndex={-1}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="max-h-60 overflow-y-auto p-1"
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
              'w-full px-3 py-2 text-left text-sm rounded-sm flex items-center gap-2 transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'focus:bg-accent focus:text-accent-foreground outline-none',
              o.value === value && 'bg-accent/60 font-medium',
            )}
            onMouseDown={(e) => { e.preventDefault(); handleSelect(o.value); }}
          >
            <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center', o.value !== value && 'invisible')}>
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1 truncate">{o.label}</span>
            {o.sublabel && (
              <span className="text-xs text-muted-foreground truncate">
                {o.sublabel}
              </span>
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

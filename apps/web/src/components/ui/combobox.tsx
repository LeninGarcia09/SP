import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
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
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = search
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          (o.sublabel?.toLowerCase().includes(search.toLowerCase()) ?? false),
      )
    : options;

  // Measure input position for fixed-positioned dropdown
  const measure = useCallback(() => {
    if (wrapRef.current) {
      setRect(wrapRef.current.getBoundingClientRect());
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        wrapRef.current && !wrapRef.current.contains(target) &&
        dropRef.current && !dropRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [open, measure]);

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setSearch('');
  }

  function openDropdown() {
    measure();
    setOpen(true);
    setSearch('');
  }

  function handleClear() {
    onChange('');
    setSearch('');
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={open ? search : selected?.label ?? ''}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) openDropdown();
          }}
          onFocus={() => openDropdown()}
          onClick={() => { if (!open) openDropdown(); }}
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
        {/* Clear button — visible when a value is selected and dropdown is closed */}
        {value && !open && !disabled && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            tabIndex={-1}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && rect && (
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
          }}
          className="rounded-md border border-gray-200 bg-white shadow-xl max-h-60 overflow-y-auto dark:bg-gray-900 dark:border-gray-700"
        >
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">
              No matches found
            </div>
          )}

          {filtered.map((o) => (
            <button
              key={o.value}
              type="button"
              className={cn(
                'w-full px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center justify-between border-b border-gray-50 dark:border-gray-800 last:border-0',
                o.value === value && 'bg-blue-50 dark:bg-blue-900/30 font-medium',
              )}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(o.value); }}
            >
              <span className="text-gray-900 dark:text-gray-100">{o.label}</span>
              {o.sublabel && (
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 truncate">
                  {o.sublabel}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

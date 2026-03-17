import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  emptyLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Search…',
  emptyLabel = 'No results',
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

  // Measure input position for portal dropdown
  const measure = useCallback(() => {
    if (wrapRef.current) {
      setRect(wrapRef.current.getBoundingClientRect());
    }
  }, []);

  // Close on outside click (check both wrapper and portal dropdown)
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

  const dropdown = open && rect && createPortal(
    <div
      ref={dropRef}
      style={{
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      }}
      className="rounded-md border bg-popover shadow-lg max-h-60 overflow-y-auto"
    >
      {/* Clear option */}
      <button
        type="button"
        className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/50 border-b"
        onClick={() => handleSelect('')}
      >
        {emptyLabel}
      </button>

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
            'w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center justify-between',
            o.value === value && 'bg-muted font-medium',
          )}
          onClick={() => handleSelect(o.value)}
        >
          <span>{o.label}</span>
          {o.sublabel && (
            <span className="text-xs text-muted-foreground ml-2 truncate">
              {o.sublabel}
            </span>
          )}
        </button>
      ))}
    </div>,
    document.body,
  );

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
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
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
        className={cn(!open && value && 'text-foreground')}
      />
      {dropdown}
    </div>
  );
}

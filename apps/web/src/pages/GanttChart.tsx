import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ZoomIn, ZoomOut } from 'lucide-react';
import type { Project } from '@telnub/shared';
import { ProjectStatus } from '@telnub/shared';
import { useProjects } from '../hooks/use-projects';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const STATUS_COLORS: Record<ProjectStatus, { bar: string; text: string }> = {
  [ProjectStatus.PLANNING]: { bar: '#9ca3af', text: '#374151' },
  [ProjectStatus.ACTIVE]: { bar: '#3b82f6', text: '#1e40af' },
  [ProjectStatus.ON_HOLD]: { bar: '#eab308', text: '#854d0e' },
  [ProjectStatus.COMPLETED]: { bar: '#22c55e', text: '#166534' },
  [ProjectStatus.CANCELLED]: { bar: '#ef4444', text: '#991b1b' },
};

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 50;
const LABEL_WIDTH = 260;

type ZoomLevel = 'weeks' | 'months' | 'quarters';

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatMonth(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatWeek(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function getQuarterStart(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), q, 1);
}

function formatQuarter(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

interface TimeSlot {
  date: Date;
  label: string;
  width: number;
}

function buildSlots(rangeStart: Date, rangeEnd: Date, zoom: ZoomLevel, dayWidth: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let cursor = new Date(rangeStart);

  if (zoom === 'weeks') {
    cursor = getMonday(cursor);
    while (cursor < rangeEnd) {
      const next = addDays(cursor, 7);
      const slotEnd = next > rangeEnd ? rangeEnd : next;
      const days = diffDays(cursor < rangeStart ? rangeStart : cursor, slotEnd);
      slots.push({ date: new Date(cursor), label: formatWeek(cursor), width: Math.max(days, 1) * dayWidth });
      cursor = next;
    }
  } else if (zoom === 'months') {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    while (cursor < rangeEnd) {
      const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      const slotStart = cursor < rangeStart ? rangeStart : cursor;
      const slotEnd = next > rangeEnd ? rangeEnd : next;
      const days = diffDays(slotStart, slotEnd);
      slots.push({ date: new Date(cursor), label: formatMonth(cursor), width: Math.max(days, 1) * dayWidth });
      cursor = next;
    }
  } else {
    cursor = getQuarterStart(cursor);
    while (cursor < rangeEnd) {
      const next = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 1);
      const slotStart = cursor < rangeStart ? rangeStart : cursor;
      const slotEnd = next > rangeEnd ? rangeEnd : next;
      const days = diffDays(slotStart, slotEnd);
      slots.push({ date: new Date(cursor), label: formatQuarter(cursor), width: Math.max(days, 1) * dayWidth });
      cursor = next;
    }
  }

  return slots;
}

const ZOOM_DAY_WIDTH: Record<ZoomLevel, number> = {
  weeks: 18,
  months: 6,
  quarters: 2,
};

export function GanttChartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [zoom, setZoom] = useState<ZoomLevel>('months');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');

  const { data, isLoading } = useProjects({ limit: 100, search: search || undefined });

  const projects = useMemo(() => {
    const list = data?.data ?? [];
    const filtered = statusFilter
      ? list.filter((p: Project) => p.status === statusFilter)
      : list;
    // Only include projects with valid date ranges
    return filtered.filter((p: Project) => p.startDate && p.endDate);
  }, [data, statusFilter]);

  const { rangeStart, rangeEnd, totalDays } = useMemo(() => {
    if (projects.length === 0) {
      const now = new Date();
      return {
        rangeStart: startOfDay(now),
        rangeEnd: startOfDay(addDays(now, 90)),
        totalDays: 90,
      };
    }
    const starts = projects.map((p: Project) => new Date(p.startDate));
    const ends = projects.map((p: Project) => new Date(p.endDate));
    const minDate = startOfDay(addDays(new Date(Math.min(...starts.map((d: Date) => d.getTime()))), -7));
    const maxDate = startOfDay(addDays(new Date(Math.max(...ends.map((d: Date) => d.getTime()))), 7));
    return { rangeStart: minDate, rangeEnd: maxDate, totalDays: diffDays(minDate, maxDate) };
  }, [projects]);

  const dayWidth = ZOOM_DAY_WIDTH[zoom];
  const chartWidth = totalDays * dayWidth;
  const chartHeight = projects.length * ROW_HEIGHT + HEADER_HEIGHT;
  const slots = useMemo(() => buildSlots(rangeStart, rangeEnd, zoom, dayWidth), [rangeStart, rangeEnd, zoom, dayWidth]);

  // Today marker
  const today = startOfDay(new Date());
  const todayX = diffDays(rangeStart, today) * dayWidth;
  const showToday = today >= rangeStart && today <= rangeEnd;

  const zoomLevels: ZoomLevel[] = ['weeks', 'months', 'quarters'];
  const zoomIn = () => {
    const idx = zoomLevels.indexOf(zoom);
    if (idx > 0) setZoom(zoomLevels[idx - 1] as ZoomLevel);
  };
  const zoomOut = () => {
    const idx = zoomLevels.indexOf(zoom);
    if (idx < zoomLevels.length - 1) setZoom(zoomLevels[idx + 1] as ZoomLevel);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('gantt.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('gantt.subtitle', { count: projects.length })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder={t('gantt.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-60"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{t('common.allStatuses')}</option>
            {Object.values(ProjectStatus).map((s) => (
              <option key={s} value={s}>{t(`statuses.${s}`)}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 border rounded-md px-1">
            <Button variant="ghost" size="sm" onClick={zoomIn} disabled={zoom === 'weeks'}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-16 text-center">{t(`gantt.zoom.${zoom}`)}</span>
            <Button variant="ghost" size="sm" onClick={zoomOut} disabled={zoom === 'quarters'}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.bar }} />
            <span className="text-muted-foreground">{t(`statuses.${status}`)}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">{t('gantt.loading')}</div>
      ) : projects.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          {t('gantt.empty')}
        </div>
      ) : (
        <div className="border rounded-lg overflow-auto bg-background" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          <div className="flex">
            {/* Fixed label column */}
            <div className="flex-shrink-0 border-r bg-card z-10 sticky left-0">
              {/* Header spacer */}
              <div
                className="border-b font-semibold text-xs text-muted-foreground flex items-center px-3"
                style={{ height: HEADER_HEIGHT, width: LABEL_WIDTH }}
              >
                {t('gantt.project')}
              </div>
              {/* Project labels */}
              {projects.map((p: Project) => (
                <div
                  key={p.id}
                  className="flex items-center px-3 cursor-pointer hover:bg-accent/50 transition-colors border-b"
                  style={{ height: ROW_HEIGHT, width: LABEL_WIDTH }}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  title={`${p.code} — ${p.name}`}
                >
                  <div className="truncate">
                    <span className="text-xs text-muted-foreground mr-2">{p.code}</span>
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div className="flex-1 overflow-x-auto">
              <svg width={chartWidth} height={chartHeight}>
                {/* Header time slots */}
                {(() => {
                  let x = 0;
                  return slots.map((slot, i) => {
                    const el = (
                      <g key={i}>
                        <rect x={x} y={0} width={slot.width} height={HEADER_HEIGHT} fill="none" stroke="#e5e7eb" />
                        <text
                          x={x + slot.width / 2}
                          y={HEADER_HEIGHT / 2 + 4}
                          textAnchor="middle"
                          className="fill-muted-foreground"
                          fontSize={11}
                        >
                          {slot.label}
                        </text>
                      </g>
                    );
                    x += slot.width;
                    return el;
                  });
                })()}

                {/* Row backgrounds with alternating color */}
                {projects.map((_: Project, idx: number) => (
                  <rect
                    key={`row-${idx}`}
                    x={0}
                    y={HEADER_HEIGHT + idx * ROW_HEIGHT}
                    width={chartWidth}
                    height={ROW_HEIGHT}
                    fill={idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'}
                    stroke="#e5e7eb"
                    strokeWidth={0.5}
                  />
                ))}

                {/* Vertical grid lines */}
                {(() => {
                  let x = 0;
                  return slots.map((slot, i) => {
                    const el = (
                      <line
                        key={`grid-${i}`}
                        x1={x}
                        y1={HEADER_HEIGHT}
                        x2={x}
                        y2={chartHeight}
                        stroke="#e5e7eb"
                        strokeWidth={0.5}
                      />
                    );
                    x += slot.width;
                    return el;
                  });
                })()}

                {/* Today marker */}
                {showToday && (
                  <g>
                    <line
                      x1={todayX}
                      y1={HEADER_HEIGHT}
                      x2={todayX}
                      y2={chartHeight}
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                    />
                    <text x={todayX + 4} y={HEADER_HEIGHT + 12} fontSize={10} fill="#ef4444">
                      {t('common.today')}
                    </text>
                  </g>
                )}

                {/* Project bars */}
                {projects.map((p: Project, i: number) => {
                  const pStart = startOfDay(new Date(p.startDate));
                  const pEnd = startOfDay(new Date(p.endDate));
                  const x = diffDays(rangeStart, pStart) * dayWidth;
                  const w = Math.max(diffDays(pStart, pEnd) * dayWidth, dayWidth);
                  const y = HEADER_HEIGHT + i * ROW_HEIGHT + 8;
                  const h = ROW_HEIGHT - 16;
                  const colors = STATUS_COLORS[p.status] ?? STATUS_COLORS[ProjectStatus.PLANNING];

                  return (
                    <g
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        rx={4}
                        fill={colors.bar}
                        opacity={0.85}
                      />
                      {/* Bar label — only if wide enough */}
                      {w > 60 && (
                        <text
                          x={x + 6}
                          y={y + h / 2 + 4}
                          fontSize={11}
                          fill="white"
                          fontWeight={500}
                          clipPath={`inset(0 ${Math.max(0, x + w - chartWidth)}px 0 0)`}
                        >
                          {p.name.length > w / 7 ? p.name.slice(0, Math.floor(w / 7)) + '…' : p.name}
                        </text>
                      )}
                      {/* Hover tooltip area */}
                      <title>
                        {p.code} — {p.name}
                        {'\n'}Status: {p.status}
                        {'\n'}{new Date(p.startDate).toLocaleDateString()} → {new Date(p.endDate).toLocaleDateString()}
                      </title>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

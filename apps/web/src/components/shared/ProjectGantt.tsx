import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Task } from '@telnub/shared';
import type { Project } from '@telnub/shared';
import { ProjectStatus } from '@telnub/shared';

// ─── Shared constants ─────────────────────────────────────
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 40;
const LABEL_WIDTH = 220;

const STATUS_COLORS: Record<string, { bar: string }> = {
  [ProjectStatus.PLANNING]:  { bar: '#9ca3af' },
  [ProjectStatus.ACTIVE]:    { bar: '#3b82f6' },
  [ProjectStatus.ON_HOLD]:   { bar: '#eab308' },
  [ProjectStatus.COMPLETED]: { bar: '#22c55e' },
  [ProjectStatus.CANCELLED]: { bar: '#ef4444' },
};

const TASK_STATUS_COLORS: Record<string, string> = {
  TODO: '#9ca3af',
  IN_PROGRESS: '#3b82f6',
  BLOCKED: '#ef4444',
  DONE: '#22c55e',
};

// ─── Date helpers ─────────────────────────────────────────
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function diffDays(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

function buildMonthSlots(rangeStart: Date, rangeEnd: Date, dayWidth: number) {
  const slots: { label: string; width: number }[] = [];
  let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  while (cursor < rangeEnd) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const s = cursor < rangeStart ? rangeStart : cursor;
    const e = next > rangeEnd ? rangeEnd : next;
    const days = diffDays(s, e);
    slots.push({
      label: cursor.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
      width: Math.max(days, 1) * dayWidth,
    });
    cursor = next;
  }
  return slots;
}

// ─── Task Gantt (for ProjectDetail) ───────────────────────
interface TaskGanttProps {
  tasks: Task[];
  projectStart?: string;
  projectEnd?: string;
}

export function TaskGantt({ tasks, projectStart, projectEnd }: TaskGanttProps) {
  const { t } = useTranslation();

  const datedTasks = useMemo(() => {
    // Tasks that have a dueDate, use project start as their implicit start
    return tasks.filter((tk) => tk.dueDate).map((tk) => ({
      ...tk,
      _start: startOfDay(new Date(projectStart ?? tk.dueDate!)),
      _end: startOfDay(new Date(tk.dueDate!)),
    }));
  }, [tasks, projectStart]);

  const { rangeStart, rangeEnd, totalDays } = useMemo(() => {
    if (datedTasks.length === 0) {
      const now = new Date();
      return { rangeStart: startOfDay(now), rangeEnd: addDays(now, 30), totalDays: 30 };
    }
    const allDates = datedTasks.flatMap((tk) => [tk._start, tk._end]);
    if (projectStart) allDates.push(startOfDay(new Date(projectStart)));
    if (projectEnd) allDates.push(startOfDay(new Date(projectEnd)));
    const min = addDays(new Date(Math.min(...allDates.map((d) => d.getTime()))), -3);
    const max = addDays(new Date(Math.max(...allDates.map((d) => d.getTime()))), 3);
    return { rangeStart: startOfDay(min), rangeEnd: startOfDay(max), totalDays: diffDays(startOfDay(min), startOfDay(max)) };
  }, [datedTasks, projectStart, projectEnd]);

  if (datedTasks.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center text-muted-foreground">
        {t('projects.noGantt')}
      </div>
    );
  }

  const dayWidth = 8;
  const chartWidth = totalDays * dayWidth;
  const chartHeight = datedTasks.length * ROW_HEIGHT + HEADER_HEIGHT;
  const slots = buildMonthSlots(rangeStart, rangeEnd, dayWidth);

  const today = startOfDay(new Date());
  const todayX = diffDays(rangeStart, today) * dayWidth;
  const showToday = today >= rangeStart && today <= rangeEnd;

  return (
    <div className="border rounded-lg overflow-auto bg-background" style={{ maxHeight: 400 }}>
      <div className="flex">
        {/* Label column */}
        <div className="flex-shrink-0 border-r bg-card z-10 sticky left-0">
          <div className="border-b text-xs font-semibold text-muted-foreground flex items-center px-3" style={{ height: HEADER_HEIGHT, width: LABEL_WIDTH }}>
            {t('projects.taskTitle')}
          </div>
          {datedTasks.map((tk) => (
            <div key={tk.id} className="flex items-center px-3 border-b truncate text-sm" style={{ height: ROW_HEIGHT, width: LABEL_WIDTH }}>
              {tk.title}
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="flex-1 overflow-x-auto">
          <svg width={chartWidth} height={chartHeight}>
            {/* Header month slots */}
            {(() => { let x = 0; return slots.map((s, i) => { const el = <g key={i}><rect x={x} y={0} width={s.width} height={HEADER_HEIGHT} fill="none" stroke="#e5e7eb" /><text x={x + s.width / 2} y={HEADER_HEIGHT / 2 + 4} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>{s.label}</text></g>; x += s.width; return el; }); })()}

            {/* Row backgrounds */}
            {datedTasks.map((_, idx) => (
              <rect key={idx} x={0} y={HEADER_HEIGHT + idx * ROW_HEIGHT} width={chartWidth} height={ROW_HEIGHT} fill={idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'} stroke="#e5e7eb" strokeWidth={0.5} />
            ))}

            {/* Today marker */}
            {showToday && (
              <line x1={todayX} y1={HEADER_HEIGHT} x2={todayX} y2={chartHeight} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" />
            )}

            {/* Bars */}
            {datedTasks.map((tk, i) => {
              const x = diffDays(rangeStart, tk._start) * dayWidth;
              const w = Math.max(diffDays(tk._start, tk._end) * dayWidth, dayWidth * 2);
              const y = HEADER_HEIGHT + i * ROW_HEIGHT + 6;
              const h = ROW_HEIGHT - 12;
              return (
                <g key={tk.id}>
                  <rect x={x} y={y} width={w} height={h} rx={3} fill={TASK_STATUS_COLORS[tk.status] ?? '#9ca3af'} opacity={0.85} />
                  <title>{tk.title} ({t(`statuses.${tk.status}`)})</title>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Multi-Project Gantt (for ProgramDetail) ──────────────
interface ProgramTimelineProps {
  projects: Array<Pick<Project, 'id' | 'code' | 'name' | 'status' | 'startDate' | 'endDate'>>;
}

export function ProgramTimeline({ projects }: ProgramTimelineProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const dated = useMemo(() =>
    projects.filter((p) => p.startDate && p.endDate).map((p) => ({
      ...p,
      _start: startOfDay(new Date(p.startDate)),
      _end: startOfDay(new Date(p.endDate)),
    })),
  [projects]);

  const { rangeStart, rangeEnd, totalDays } = useMemo(() => {
    if (dated.length === 0) {
      const now = new Date();
      return { rangeStart: startOfDay(now), rangeEnd: addDays(now, 90), totalDays: 90 };
    }
    const min = addDays(new Date(Math.min(...dated.map((p) => p._start.getTime()))), -7);
    const max = addDays(new Date(Math.max(...dated.map((p) => p._end.getTime()))), 7);
    return { rangeStart: startOfDay(min), rangeEnd: startOfDay(max), totalDays: diffDays(startOfDay(min), startOfDay(max)) };
  }, [dated]);

  if (dated.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center text-muted-foreground">
        {t('programs.noTimeline')}
      </div>
    );
  }

  const dayWidth = 6;
  const chartWidth = totalDays * dayWidth;
  const chartHeight = dated.length * ROW_HEIGHT + HEADER_HEIGHT;
  const slots = buildMonthSlots(rangeStart, rangeEnd, dayWidth);

  const today = startOfDay(new Date());
  const todayX = diffDays(rangeStart, today) * dayWidth;
  const showToday = today >= rangeStart && today <= rangeEnd;

  return (
    <div className="border rounded-lg overflow-auto bg-background" style={{ maxHeight: 400 }}>
      <div className="flex">
        {/* Label column */}
        <div className="flex-shrink-0 border-r bg-card z-10 sticky left-0">
          <div className="border-b text-xs font-semibold text-muted-foreground flex items-center px-3" style={{ height: HEADER_HEIGHT, width: LABEL_WIDTH }}>
            {t('common.project')}
          </div>
          {dated.map((p) => (
            <div
              key={p.id}
              className="flex items-center px-3 border-b cursor-pointer hover:bg-accent/50 transition-colors"
              style={{ height: ROW_HEIGHT, width: LABEL_WIDTH }}
              onClick={() => navigate(`/projects/${p.id}`)}
            >
              <div className="truncate">
                <span className="text-xs text-muted-foreground mr-2">{p.code}</span>
                <span className="text-sm font-medium">{p.name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="flex-1 overflow-x-auto">
          <svg width={chartWidth} height={chartHeight}>
            {(() => { let x = 0; return slots.map((s, i) => { const el = <g key={i}><rect x={x} y={0} width={s.width} height={HEADER_HEIGHT} fill="none" stroke="#e5e7eb" /><text x={x + s.width / 2} y={HEADER_HEIGHT / 2 + 4} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>{s.label}</text></g>; x += s.width; return el; }); })()}

            {dated.map((_, idx) => (
              <rect key={idx} x={0} y={HEADER_HEIGHT + idx * ROW_HEIGHT} width={chartWidth} height={ROW_HEIGHT} fill={idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'} stroke="#e5e7eb" strokeWidth={0.5} />
            ))}

            {showToday && (
              <g>
                <line x1={todayX} y1={HEADER_HEIGHT} x2={todayX} y2={chartHeight} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" />
                <text x={todayX + 3} y={HEADER_HEIGHT + 10} fontSize={9} fill="#ef4444">{t('common.today')}</text>
              </g>
            )}

            {dated.map((p, i) => {
              const x = diffDays(rangeStart, p._start) * dayWidth;
              const w = Math.max(diffDays(p._start, p._end) * dayWidth, dayWidth * 2);
              const y = HEADER_HEIGHT + i * ROW_HEIGHT + 6;
              const h = ROW_HEIGHT - 12;
              const color = STATUS_COLORS[p.status]?.bar ?? '#9ca3af';
              return (
                <g key={p.id} className="cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                  <rect x={x} y={y} width={w} height={h} rx={4} fill={color} opacity={0.85} />
                  {w > 50 && (
                    <text x={x + 4} y={y + h / 2 + 3} fontSize={10} fill="white" fontWeight={500}>
                      {p.name.length > w / 6 ? p.name.slice(0, Math.floor(w / 6)) + '…' : p.name}
                    </text>
                  )}
                  <title>{p.code} — {p.name} ({t(`statuses.${p.status}`)})</title>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

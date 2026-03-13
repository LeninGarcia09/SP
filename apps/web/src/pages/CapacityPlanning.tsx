import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Person, Project, ProjectAssignment } from '@bizops/shared';
import { usePersonnel } from '../hooks/use-personnel';
import { useAllActiveAssignments } from '../hooks/use-personnel';
import { useProjects } from '../hooks/use-projects';

const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 50;
const NAME_WIDTH = 220;
const DAY_WIDTH = 12;
const DAYS = 90;

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

function getAllocationColor(total: number): string {
  if (total === 0) return '#f3f4f6'; // gray-100 — bench
  if (total <= 50) return '#bbf7d0'; // green-200  — under-allocated
  if (total <= 100) return '#3b82f6'; // blue-500  — fully allocated
  return '#ef4444'; // red-500 — over-allocated
}

// Labels used in SVG title tooltips — will be resolved at render time via t()
const ALLOC_LABEL_KEYS = {
  bench: 'capacity.tooltipStatus.bench',
  under: 'capacity.tooltipStatus.under',
  allocated: 'capacity.tooltipStatus.allocated',
  over: 'capacity.tooltipStatus.over',
} as const;

function getAllocationLabelKey(total: number): string {
  if (total === 0) return ALLOC_LABEL_KEYS.bench;
  if (total <= 50) return ALLOC_LABEL_KEYS.under;
  if (total <= 100) return ALLOC_LABEL_KEYS.allocated;
  return ALLOC_LABEL_KEYS.over;
}

interface AssignmentWithRelations extends ProjectAssignment {
  person?: Person;
  project?: Project;
}

interface PersonRow {
  person: Person;
  assignments: AssignmentWithRelations[];
  dailyAllocation: number[]; // 90 entries, each is total % for that day
}

export function CapacityPlanningPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: personnelData, isLoading: loadingPersonnel } = usePersonnel({ limit: 500 });
  const { data: assignmentsData, isLoading: loadingAssignments } = useAllActiveAssignments();
  const { data: projectsData } = useProjects({ limit: 500 });

  const today = startOfDay(new Date());
  const rangeEnd = addDays(today, DAYS);

  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    for (const p of (projectsData?.data ?? [])) {
      map.set(p.id, p);
    }
    return map;
  }, [projectsData]);

  const rows: PersonRow[] = useMemo(() => {
    const people: Person[] = personnelData?.data ?? [];
    const allAssignments: AssignmentWithRelations[] = (assignmentsData?.data ?? []) as AssignmentWithRelations[];

    // Group assignments by personId
    const assignmentsByPerson = new Map<string, AssignmentWithRelations[]>();
    for (const a of allAssignments) {
      const list = assignmentsByPerson.get(a.personId) ?? [];
      list.push(a);
      assignmentsByPerson.set(a.personId, list);
    }

    return people.map((person) => {
      const assignments = assignmentsByPerson.get(person.id) ?? [];
      const dailyAllocation: number[] = [];

      for (let d = 0; d < DAYS; d++) {
        const dayDate = addDays(today, d);
        let totalAlloc = 0;
        for (const a of assignments) {
          const aStart = a.startDate ? startOfDay(new Date(a.startDate)) : null;
          const aEnd = a.endDate ? startOfDay(new Date(a.endDate)) : null;
          // Assignment applies if day is within range (open-ended if no endDate)
          const afterStart = !aStart || dayDate >= aStart;
          const beforeEnd = !aEnd || dayDate <= aEnd;
          if (afterStart && beforeEnd) {
            totalAlloc += a.allocationPercent;
          }
        }
        dailyAllocation.push(totalAlloc);
      }

      return { person, assignments, dailyAllocation };
    }).sort((a, b) => {
      // Sort: over-allocated first, then bench last
      const aMax = Math.max(...a.dailyAllocation);
      const bMax = Math.max(...b.dailyAllocation);
      return bMax - aMax;
    });
  }, [personnelData, assignmentsData, today]);

  // Build month markers
  const monthMarkers = useMemo(() => {
    const markers: { label: string; x: number; width: number }[] = [];
    let cursor = new Date(today);
    while (cursor < rangeEnd) {
      const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      const effectiveStart = cursor > monthStart ? cursor : monthStart;
      const effectiveEnd = monthEnd > rangeEnd ? rangeEnd : monthEnd;
      const x = diffDays(today, effectiveStart) * DAY_WIDTH;
      const width = diffDays(effectiveStart, effectiveEnd) * DAY_WIDTH;
      markers.push({
        label: effectiveStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        x,
        width,
      });
      cursor = monthEnd;
    }
    return markers;
  }, [today, rangeEnd]);

  // Summary stats
  const stats = useMemo(() => {
    let bench = 0;
    let underAlloc = 0;
    let fullyAlloc = 0;
    let overAlloc = 0;
    for (const row of rows) {
      const avg = row.dailyAllocation.reduce((s, v) => s + v, 0) / DAYS;
      if (avg === 0) bench++;
      else if (avg <= 50) underAlloc++;
      else if (avg <= 100) fullyAlloc++;
      else overAlloc++;
    }
    return { bench, underAlloc, fullyAlloc, overAlloc, total: rows.length };
  }, [rows]);

  const chartWidth = DAYS * DAY_WIDTH;
  const chartHeight = rows.length * ROW_HEIGHT + HEADER_HEIGHT;
  const isLoading = loadingPersonnel || loadingAssignments;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('capacity.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('capacity.subtitle')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">{t('capacity.totalPersonnel')}</div>
        </div>
        <div className="rounded-lg border p-3 text-center bg-blue-50">
          <div className="text-2xl font-bold text-blue-600">{stats.fullyAlloc}</div>
          <div className="text-xs text-muted-foreground">{t('capacity.fullyAllocated')}</div>
        </div>
        <div className="rounded-lg border p-3 text-center bg-green-50">
          <div className="text-2xl font-bold text-green-600">{stats.underAlloc}</div>
          <div className="text-xs text-muted-foreground">{t('capacity.underAllocated')}</div>
        </div>
        <div className="rounded-lg border p-3 text-center bg-red-50">
          <div className="text-2xl font-bold text-red-600">{stats.overAlloc}</div>
          <div className="text-xs text-muted-foreground">{t('capacity.overAllocated')}</div>
        </div>
        <div className="rounded-lg border p-3 text-center bg-gray-50">
          <div className="text-2xl font-bold text-gray-600">{stats.bench}</div>
          <div className="text-xs text-muted-foreground">{t('capacity.onBench')}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        {[
          { color: '#3b82f6', label: t('capacity.legend.allocated') },
          { color: '#bbf7d0', label: t('capacity.legend.under') },
          { color: '#ef4444', label: t('capacity.legend.over') },
          { color: '#f3f4f6', label: t('capacity.legend.bench') },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">{t('capacity.loading')}</div>
      ) : rows.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">{t('capacity.empty')}</div>
      ) : (
        <div className="border rounded-lg overflow-auto bg-background" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          <div className="flex">
            {/* Fixed name column */}
            <div className="flex-shrink-0 border-r bg-card z-10 sticky left-0">
              <div
                className="border-b font-semibold text-xs text-muted-foreground flex items-center px-3"
                style={{ height: HEADER_HEIGHT, width: NAME_WIDTH }}
              >
                {t('capacity.personnel')}
              </div>
              {rows.map((row) => (
                <div
                  key={row.person.id}
                  className="flex items-center px-3 cursor-pointer hover:bg-accent/50 transition-colors border-b"
                  style={{ height: ROW_HEIGHT, width: NAME_WIDTH }}
                  onClick={() => navigate(`/personnel/${row.person.id}`)}
                >
                  <div className="truncate">
                    <div className="text-sm font-medium">
                      {row.person.firstName} {row.person.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{row.person.jobTitle}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Heatmap chart */}
            <div className="flex-1 overflow-x-auto">
              <svg width={chartWidth} height={chartHeight}>
                {/* Month headers */}
                {monthMarkers.map((m, i) => (
                  <g key={i}>
                    <rect x={m.x} y={0} width={m.width} height={HEADER_HEIGHT} fill="none" stroke="#e5e7eb" />
                    <text
                      x={m.x + m.width / 2}
                      y={HEADER_HEIGHT / 2 + 4}
                      textAnchor="middle"
                      className="fill-muted-foreground"
                      fontSize={11}
                    >
                      {m.label}
                    </text>
                  </g>
                ))}

                {/* Today marker */}
                <line
                  x1={0}
                  y1={HEADER_HEIGHT}
                  x2={0}
                  y2={chartHeight}
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                />
                <text x={4} y={HEADER_HEIGHT + 12} fontSize={9} fill="#ef4444">{t('common.today')}</text>

                {/* Heatmap rows */}
                {rows.map((row, rowIdx) => (
                  <g key={row.person.id}>
                    {row.dailyAllocation.map((alloc, dayIdx) => (
                      <rect
                        key={dayIdx}
                        x={dayIdx * DAY_WIDTH}
                        y={HEADER_HEIGHT + rowIdx * ROW_HEIGHT + 4}
                        width={DAY_WIDTH - 1}
                        height={ROW_HEIGHT - 8}
                        rx={2}
                        fill={getAllocationColor(alloc)}
                        opacity={alloc > 0 ? Math.min(0.3 + (alloc / 100) * 0.7, 1) : 0.4}
                      >
                        <title>
                          {row.person.firstName} {row.person.lastName}
                          {'\n'}{addDays(today, dayIdx).toLocaleDateString()}
                          {'\n'}{t(getAllocationLabelKey(alloc))} ({alloc}%)
                          {alloc > 0 && row.assignments
                            .filter((a) => {
                              const dayDate = addDays(today, dayIdx);
                              const aStart = a.startDate ? startOfDay(new Date(a.startDate)) : null;
                              const aEnd = a.endDate ? startOfDay(new Date(a.endDate)) : null;
                              return (!aStart || dayDate >= aStart) && (!aEnd || dayDate <= aEnd);
                            })
                            .map((a) => {
                              const proj = projectMap.get(a.projectId);
                              return `\n• ${proj?.name ?? a.projectId} (${a.allocationPercent}%)`;
                            })
                            .join('')}
                        </title>
                      </rect>
                    ))}
                  </g>
                ))}

                {/* Week grid lines */}
                {Array.from({ length: Math.ceil(DAYS / 7) }, (_, i) => i * 7).map((d) => (
                  <line
                    key={`week-${d}`}
                    x1={d * DAY_WIDTH}
                    y1={HEADER_HEIGHT}
                    x2={d * DAY_WIDTH}
                    y2={chartHeight}
                    stroke="#e5e7eb"
                    strokeWidth={0.5}
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

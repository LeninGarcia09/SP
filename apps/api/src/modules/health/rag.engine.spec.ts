import { RagEngine } from './rag.engine';
import { ProjectEntity } from '../projects/project.entity';
import { TaskEntity } from '../tasks/task.entity';
import { ProjectStatus } from '@telnub/shared';

function makeProject(overrides: Partial<ProjectEntity> = {}): ProjectEntity {
  return {
    id: 'proj-1',
    code: 'PROJ-001',
    name: 'Test Project',
    description: '',
    status: ProjectStatus.ACTIVE,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    budget: 100,
    actualCost: 0,
    costRate: 0,
    programId: null,
    projectLeadId: 'user-1',
    createdBy: 'user-1',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as ProjectEntity;
}

function makeTask(overrides: Partial<TaskEntity> = {}): TaskEntity {
  return {
    id: 'task-1',
    projectId: 'proj-1',
    title: 'Test Task',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: null,
    dueDate: null,
    estimatedHours: 0,
    actualHours: 0,
    parentTaskId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TaskEntity;
}

// Future date string for non-overdue tasks
const FUTURE = '2027-01-01';
// Past date string for overdue tasks
const PAST = '2020-01-01';

describe('RagEngine', () => {
  let engine: RagEngine;

  beforeEach(() => {
    engine = new RagEngine();
  });

  // ── Schedule RAG ────────────────────────────────────────

  describe('Schedule RAG', () => {
    it('returns GRAY for PLANNING projects', () => {
      const project = makeProject({ status: ProjectStatus.PLANNING });
      const result = engine.calculate(project, []);
      expect(result.scheduleRag).toBe('GRAY');
    });

    it('returns BLUE when COMPLETED and all tasks done', () => {
      const project = makeProject({ status: ProjectStatus.COMPLETED });
      const tasks = [makeTask({ status: 'DONE' }), makeTask({ id: 'task-2', status: 'DONE' })];
      const result = engine.calculate(project, tasks);
      expect(result.scheduleRag).toBe('BLUE');
    });

    it('returns BLUE when COMPLETED with no tasks', () => {
      const project = makeProject({ status: ProjectStatus.COMPLETED });
      const result = engine.calculate(project, []);
      expect(result.scheduleRag).toBe('BLUE');
    });

    it('returns GREEN when no tasks and project is ACTIVE', () => {
      const project = makeProject({ status: ProjectStatus.ACTIVE });
      const result = engine.calculate(project, []);
      expect(result.scheduleRag).toBe('GREEN');
    });

    it('returns GREEN when < 5% tasks are overdue', () => {
      const project = makeProject({ status: ProjectStatus.ACTIVE });
      // 25 tasks, 1 overdue = 4%
      const tasks: TaskEntity[] = [];
      for (let i = 0; i < 24; i++) {
        tasks.push(makeTask({ id: `task-${i}`, status: 'TODO', dueDate: FUTURE }));
      }
      tasks.push(makeTask({ id: 'overdue', status: 'TODO', dueDate: PAST }));
      const result = engine.calculate(project, tasks);
      expect(result.scheduleRag).toBe('GREEN');
    });

    it('returns AMBER when 5-20% tasks are overdue', () => {
      const project = makeProject({ status: ProjectStatus.ACTIVE });
      // 10 tasks, 1 overdue = 10%
      const tasks: TaskEntity[] = [];
      for (let i = 0; i < 9; i++) {
        tasks.push(makeTask({ id: `task-${i}`, status: 'TODO', dueDate: FUTURE }));
      }
      tasks.push(makeTask({ id: 'overdue', status: 'TODO', dueDate: PAST }));
      const result = engine.calculate(project, tasks);
      expect(result.scheduleRag).toBe('AMBER');
    });

    it('returns AMBER when a CRITICAL task is overdue', () => {
      const project = makeProject({ status: ProjectStatus.ACTIVE });
      // 25 tasks, 1 critical overdue = 4% but CRITICAL
      const tasks: TaskEntity[] = [];
      for (let i = 0; i < 24; i++) {
        tasks.push(makeTask({ id: `task-${i}`, status: 'TODO', dueDate: FUTURE }));
      }
      tasks.push(makeTask({ id: 'critical', status: 'IN_PROGRESS', priority: 'CRITICAL', dueDate: PAST }));
      const result = engine.calculate(project, tasks);
      expect(result.scheduleRag).toBe('AMBER');
    });

    it('returns RED when > 20% tasks are overdue', () => {
      const project = makeProject({ status: ProjectStatus.ACTIVE });
      // 4 tasks, 2 overdue = 50%
      const tasks = [
        makeTask({ id: 'task-1', status: 'TODO', dueDate: FUTURE }),
        makeTask({ id: 'task-2', status: 'TODO', dueDate: FUTURE }),
        makeTask({ id: 'overdue-1', status: 'TODO', dueDate: PAST }),
        makeTask({ id: 'overdue-2', status: 'IN_PROGRESS', dueDate: PAST }),
      ];
      const result = engine.calculate(project, tasks);
      expect(result.scheduleRag).toBe('RED');
    });

    it('returns RED when project end date has passed while ACTIVE', () => {
      const project = makeProject({ status: ProjectStatus.ACTIVE, endDate: '2020-01-01' });
      const result = engine.calculate(project, [makeTask({ status: 'TODO' })]);
      expect(result.scheduleRag).toBe('RED');
    });

    it('ignores DONE tasks when counting overdue', () => {
      const project = makeProject({ status: ProjectStatus.ACTIVE });
      // 2 tasks, 1 done (overdue but doesn't count), 1 not overdue
      const tasks = [
        makeTask({ id: 'done', status: 'DONE', dueDate: PAST }),
        makeTask({ id: 'ok', status: 'TODO', dueDate: FUTURE }),
      ];
      const result = engine.calculate(project, tasks);
      expect(result.scheduleRag).toBe('GREEN');
    });

    it('ignores tasks with no due date', () => {
      const project = makeProject({ status: ProjectStatus.ACTIVE });
      const tasks = [
        makeTask({ id: 'no-due', status: 'TODO', dueDate: null }),
        makeTask({ id: 'ok', status: 'TODO', dueDate: FUTURE }),
      ];
      const result = engine.calculate(project, tasks);
      expect(result.scheduleRag).toBe('GREEN');
    });
  });

  // ── Budget RAG ──────────────────────────────────────────

  describe('Budget RAG', () => {
    it('returns GRAY when no budget is set', () => {
      const project = makeProject({ budget: null as unknown as number });
      const result = engine.calculate(project, []);
      expect(result.budgetRag).toBe('GRAY');
    });

    it('returns GRAY when budget is 0', () => {
      const project = makeProject({ budget: 0 });
      const result = engine.calculate(project, []);
      expect(result.budgetRag).toBe('GRAY');
    });

    it('returns GRAY when budget set but no cost data available', () => {
      const project = makeProject({ budget: 100, actualCost: 0, costRate: 0 });
      const tasks = [makeTask({ actualHours: 80 })];
      const result = engine.calculate(project, tasks);
      expect(result.budgetRag).toBe('GRAY');
    });

    it('returns GREEN when actualCost ≤ 90% of budget', () => {
      const project = makeProject({ budget: 100, actualCost: 80 });
      const result = engine.calculate(project, []);
      expect(result.budgetRag).toBe('GREEN');
    });

    it('returns AMBER when actualCost is 90-100% of budget', () => {
      const project = makeProject({ budget: 100, actualCost: 95 });
      const result = engine.calculate(project, []);
      expect(result.budgetRag).toBe('AMBER');
    });

    it('returns RED when actualCost > 100% of budget', () => {
      const project = makeProject({ budget: 100, actualCost: 110 });
      const result = engine.calculate(project, []);
      expect(result.budgetRag).toBe('RED');
    });

    it('derives cost from hours * costRate when no actualCost', () => {
      const project = makeProject({ budget: 1000, actualCost: 0, costRate: 50 });
      const tasks = [makeTask({ actualHours: 16 })]; // 16 * 50 = 800 → 80% → GREEN
      const result = engine.calculate(project, tasks);
      expect(result.budgetRag).toBe('GREEN');
    });

    it('returns AMBER when derived cost is 90-100% of budget', () => {
      const project = makeProject({ budget: 1000, actualCost: 0, costRate: 50 });
      const tasks = [makeTask({ actualHours: 19 })]; // 19 * 50 = 950 → 95% → AMBER
      const result = engine.calculate(project, tasks);
      expect(result.budgetRag).toBe('AMBER');
    });

    it('returns RED when derived cost exceeds budget', () => {
      const project = makeProject({ budget: 1000, actualCost: 0, costRate: 50 });
      const tasks = [makeTask({ actualHours: 22 })]; // 22 * 50 = 1100 → 110% → RED
      const result = engine.calculate(project, tasks);
      expect(result.budgetRag).toBe('RED');
    });

    it('prefers actualCost over derived cost when both available', () => {
      const project = makeProject({ budget: 1000, actualCost: 500, costRate: 50 });
      const tasks = [makeTask({ actualHours: 100 })]; // derived = 5000 but actualCost = 500 wins
      const result = engine.calculate(project, tasks);
      expect(result.budgetRag).toBe('GREEN'); // 500/1000 = 50%
    });
  });

  // ── Overall RAG ─────────────────────────────────────────

  describe('Overall RAG', () => {
    it('returns worst of schedule and budget RAGs', () => {
      // Schedule GREEN, Budget RED → overall RED
      const project = makeProject({ status: ProjectStatus.ACTIVE, budget: 100, actualCost: 110 });
      const tasks = [makeTask({ dueDate: FUTURE, status: 'TODO' })];
      const result = engine.calculate(project, tasks);
      expect(result.scheduleRag).toBe('GREEN');
      expect(result.budgetRag).toBe('RED');
      expect(result.overallRag).toBe('RED');
    });

    it('returns GREEN when both sub-RAGs are GREEN', () => {
      const project = makeProject({ status: ProjectStatus.ACTIVE, budget: 100, actualCost: 50 });
      const tasks = [makeTask({ dueDate: FUTURE, status: 'TODO' })];
      const result = engine.calculate(project, tasks);
      expect(result.overallRag).toBe('GREEN');
    });

    it('returns GRAY when project is PLANNING and no budget', () => {
      const project = makeProject({ status: ProjectStatus.PLANNING, budget: null as unknown as number });
      const result = engine.calculate(project, []);
      expect(result.overallRag).toBe('GRAY');
    });
  });
});

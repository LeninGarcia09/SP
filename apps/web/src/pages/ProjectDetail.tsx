import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, RefreshCw, Trash2, Pin } from 'lucide-react';
import { useProject, useDeleteProject, useProjectMembers, useAddProjectMember, useRemoveProjectMember, useProjectNotes, useCreateProjectNote, useUpdateProjectNote, useDeleteProjectNote } from '../hooks/use-projects';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/use-tasks';
import { useHealthHistory, useTriggerHealth } from '../hooks/use-health';
import { usePersonnel } from '../hooks/use-personnel';
import { useUsers } from '../hooks/use-users';
import { ProjectFormDialog } from '../components/projects/ProjectFormDialog';
import { TaskGantt } from '../components/shared/ProjectGantt';
import { TaskActivityTimeline } from '../components/tasks/TaskActivityTimeline';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Combobox } from '../components/ui/combobox';
import type { ComboboxOption } from '../components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import type { Task } from '@bizops/shared';
import { TaskStatus, Priority, RagStatus, ProjectMemberRole } from '@bizops/shared';

const ragColors: Record<RagStatus, string> = {
  [RagStatus.GREEN]: 'bg-green-100 text-green-700',
  [RagStatus.AMBER]: 'bg-yellow-100 text-yellow-700',
  [RagStatus.RED]: 'bg-red-100 text-red-700',
  [RagStatus.BLUE]: 'bg-blue-100 text-blue-700',
  [RagStatus.GRAY]: 'bg-gray-100 text-gray-700',
};

const priorityColors: Record<Priority, string> = {
  [Priority.LOW]: 'bg-gray-100 text-gray-700',
  [Priority.MEDIUM]: 'bg-blue-100 text-blue-700',
  [Priority.HIGH]: 'bg-orange-100 text-orange-700',
  [Priority.CRITICAL]: 'bg-red-100 text-red-700',
};

const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'bg-gray-100 text-gray-700',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-700',
  [TaskStatus.BLOCKED]: 'bg-red-100 text-red-700',
  [TaskStatus.DONE]: 'bg-green-100 text-green-700',
};

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const project = useProject(id!);
  const tasks = useTasks(id!);
  const health = useHealthHistory(id!);
  const triggerHealth = useTriggerHealth(id!);
  const deleteProject = useDeleteProject();
  const createTask = useCreateTask(id!);
  const updateTask = useUpdateTask(id!);
  const deleteTask = useDeleteTask(id!);
  const members = useProjectMembers(id!);
  const addMember = useAddProjectMember();
  const removeMember = useRemoveProjectMember();
  const notes = useProjectNotes(id!);
  const createNote = useCreateProjectNote(id!);
  const updateNote = useUpdateProjectNote(id!);
  const deleteNote = useDeleteProjectNote(id!);
  const usersQuery = useUsers({ limit: 100 });
  const personnelQuery = usePersonnel({ limit: 100 });

  // Build searchable assignee options from users + personnel
  const assigneeOptions = useMemo<ComboboxOption[]>(() => {
    const opts: ComboboxOption[] = [];
    const seen = new Set<string>();

    // Build personnel lookup by userId for richer names on User records
    const personnelByUserId = new Map<string, { firstName: string; lastName: string; email: string }>();
    for (const p of personnelQuery.data?.data ?? []) {
      if (p.userId) personnelByUserId.set(p.userId, p);
    }

    // 1. Users: prefer firstName+lastName from personnel record when available
    for (const u of usersQuery.data?.data ?? []) {
      if (!seen.has(u.id)) {
        seen.add(u.id);
        const person = personnelByUserId.get(u.id);
        opts.push({
          value: u.id,
          label: person ? `${person.firstName} ${person.lastName}` : u.displayName,
          sublabel: u.email,
        });
      }
    }

    // 2. All personnel — use person.id as value (works for both linked and unlinked)
    for (const p of personnelQuery.data?.data ?? []) {
      const key = p.userId ?? p.id;
      if (!seen.has(key)) {
        seen.add(key);
        opts.push({ value: p.id, label: `${p.firstName} ${p.lastName}`, sublabel: p.email });
      }
    }

    return opts;
  }, [usersQuery.data, personnelQuery.data]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: TaskStatus.TODO as TaskStatus,
    priority: Priority.MEDIUM as Priority,
    assigneeId: '',
    startDate: '',
    dueDate: '',
  });

  const [memberForm, setMemberForm] = useState({
    userId: '',
    role: ProjectMemberRole.MEMBER as ProjectMemberRole,
  });

  if (project.isLoading) {
    return <div className="text-center text-muted-foreground py-12">{t('common.loading')}</div>;
  }

  if (project.isError || !project.data?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{t('projects.notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {t('projects.backTo')}
        </Button>
      </div>
    );
  }

  const p = project.data.data;
  const latestHealth = health.data?.data?.[0];

  function openNewTask() {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      assigneeId: '',
      startDate: '',
      dueDate: '',
    });
    setTaskDialogOpen(true);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId ?? '',
      startDate: task.startDate ?? '',
      dueDate: task.dueDate ?? '',
    });
    setTaskDialogOpen(true);
  }

  async function handleTaskSubmit() {
    const body: Record<string, unknown> = {
      title: taskForm.title,
      description: taskForm.description,
      status: taskForm.status,
      priority: taskForm.priority,
      assigneeId: taskForm.assigneeId || null,
      startDate: taskForm.startDate || null,
      dueDate: taskForm.dueDate || null,
    };

    if (editingTask) {
      await updateTask.mutateAsync({ taskId: editingTask.id, ...body });
    } else {
      await createTask.mutateAsync(body);
    }
    setTaskDialogOpen(false);
  }

  async function handleDeleteProject() {
    if (!confirm('Are you sure you want to delete this project?')) return;
    await deleteProject.mutateAsync(id!);
    navigate('/projects');
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm('Delete this task?')) return;
    await deleteTask.mutateAsync(taskId);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> {t('projects.title')}
          </button>
          <h2 className="text-2xl font-bold">{p.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {p.code} · {p.status.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>{t('common.edit')}</Button>
          <Button variant="destructive" onClick={handleDeleteProject}>{t('common.delete')}</Button>
        </div>
      </div>

      <ProjectFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} project={p} />

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('common.startDate')}</p>
          <p className="font-medium">{p.startDate}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('common.endDate')}</p>
          <p className="font-medium">{p.endDate}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('common.budget')}</p>
          <p className="font-medium">${Number(p.budget).toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('projects.actualCost')}</p>
          <p className="font-medium">${Number(p.actualCost).toLocaleString()}</p>
          {Number(p.budget) > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {((Number(p.actualCost) / Number(p.budget)) * 100).toFixed(1)}% {t('projects.ofBudget')}
            </p>
          )}
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('projects.health')}</p>
          {latestHealth ? (
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${ragColors[latestHealth.overallRag]}`}>
              {t(`statuses.${latestHealth.overallRag}`)}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">{t('projects.noHealth')}</span>
          )}
        </div>
      </div>

      {p.description && (
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('common.description')}</p>
          <p className="text-sm whitespace-pre-wrap">{p.description}</p>
        </div>
      )}

      {/* Gantt Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">{t('projects.gantt')}</h3>
        <TaskGantt tasks={tasks.data?.data ?? []} projectStart={p.startDate} projectEnd={p.endDate} />
      </div>

      {/* Tasks Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{t('projects.tasks')}</h3>
          <Button size="sm" onClick={openNewTask}>
            <Plus className="h-4 w-4 mr-1" /> {t('projects.addTask')}
          </Button>
        </div>

        {tasks.isLoading && (
          <div className="rounded-lg border p-4 text-center text-muted-foreground">{t('projects.loadingTasks')}</div>
        )}

        {tasks.data?.data && tasks.data.data.length === 0 && (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">{t('projects.noTasks')}</div>
        )}

        {tasks.data?.data && tasks.data.data.length > 0 && (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t('projects.taskTitle')}</th>
                  <th className="text-left p-3 font-medium">{t('tasks.createdBy')}</th>
                  <th className="text-left p-3 font-medium">{t('tasks.assignee')}</th>
                  <th className="text-left p-3 font-medium">{t('common.status')}</th>
                  <th className="text-left p-3 font-medium">{t('projects.priority')}</th>
                  <th className="text-left p-3 font-medium">{t('tasks.startDate')}</th>
                  <th className="text-left p-3 font-medium">{t('tasks.requiredEnd')}</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {tasks.data.data.map((task) => {
                  const isOverdue = task.dueDate && task.status !== TaskStatus.DONE && new Date(task.dueDate) < new Date();
                  return (
                  <tr
                    key={task.id}
                    className={`border-b last:border-0 hover:bg-muted/25 cursor-pointer ${isOverdue ? 'bg-red-50' : ''}`}
                    onClick={() => openEditTask(task)}
                  >
                    <td className="p-3 font-medium">{task.title}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {task.createdById
                        ? assigneeOptions.find((o) => o.value === task.createdById)?.label ?? '—'
                        : '—'}
                      <br />
                      <span className="text-[10px]">{new Date(task.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="p-3 text-xs">
                      {task.assigneeId
                        ? assigneeOptions.find((o) => o.value === task.assigneeId)?.label ?? task.assigneeId.slice(0, 8)
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[task.status]}`}>
                        {t(`statuses.${task.status}`)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${priorityColors[task.priority]}`}>
                        {t(`priorities.${task.priority}`)}
                      </span>
                    </td>
                    <td className="p-3">{task.startDate ?? '—'}</td>
                    <td className={`p-3 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                      {task.dueDate ?? '—'}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Members Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{t('projects.teamMembers')}</h3>
          <Button size="sm" onClick={() => {
            setMemberForm({ userId: '', role: ProjectMemberRole.MEMBER });
            setMemberDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-1" /> {t('projects.addMember')}
          </Button>
        </div>

        {members.isLoading && (
          <div className="rounded-lg border p-4 text-center text-muted-foreground">{t('projects.loadingMembers')}</div>
        )}

        {members.data?.data && members.data.data.length === 0 && (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">{t('projects.noMembers')}</div>
        )}

        {members.data?.data && members.data.data.length > 0 && (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t('common.name')}</th>
                  <th className="text-left p-3 font-medium">{t('projects.role')}</th>
                  <th className="text-left p-3 font-medium">{t('projects.joined')}</th>
                  <th className="text-left p-3 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {members.data.data.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="p-3 text-sm">
                      {assigneeOptions.find((o) => o.value === m.userId)?.label ?? m.userId.slice(0, 8)}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        m.role === ProjectMemberRole.LEAD ? 'bg-purple-100 text-purple-700' :
                        m.role === ProjectMemberRole.OBSERVER ? 'bg-gray-100 text-gray-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="p-3">{new Date(m.joinedAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember.mutate(m.id)}
                        disabled={removeMember.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Health Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{t('projects.healthHistory')}</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => triggerHealth.mutate()}
            disabled={triggerHealth.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${triggerHealth.isPending ? 'animate-spin' : ''}`} />
            {t('projects.triggerHealth')}
          </Button>
        </div>

        {health.isLoading && (
          <div className="rounded-lg border p-4 text-center text-muted-foreground">{t('common.loading')}</div>
        )}

        {health.data?.data && health.data.data.length === 0 && (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">
            {t('projects.noHealthHistory')}
          </div>
        )}

        {health.data?.data && health.data.data.length > 0 && (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t('projects.snapshotDate')}</th>
                  <th className="text-left p-3 font-medium">{t('projects.overall')}</th>
                  <th className="text-left p-3 font-medium">{t('projects.schedule')}</th>
                  <th className="text-left p-3 font-medium">{t('projects.budgetRag')}</th>
                  <th className="text-left p-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {health.data.data.map((snap) => (
                  <tr key={snap.id} className="border-b last:border-0">
                    <td className="p-3">{snap.snapshotDate}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${ragColors[snap.overallRag]}`}>
                      {t(`statuses.${snap.overallRag}`)}
                    </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${ragColors[snap.scheduleRag]}`}>
                        {t(`statuses.${snap.scheduleRag}`)}
                    </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${ragColors[snap.budgetRag]}`}>
                        {t(`statuses.${snap.budgetRag}`)}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {snap.autoCalculated ? t('projects.autoCalc') : 'Override'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{t('common.notes')}</h3>
          <Button
            size="sm"
            onClick={() => {
              setEditingNoteId(null);
              setNoteContent('');
              setNoteDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Note
          </Button>
        </div>

        {notes.isLoading && (
          <div className="rounded-lg border p-4 text-center text-muted-foreground">{t('common.loading')}</div>
        )}

        {notes.data?.data && notes.data.data.length === 0 && (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">
            {t('common.notes')}
          </div>
        )}

        {notes.data?.data && notes.data.data.length > 0 && (
          <div className="space-y-3">
            {notes.data.data.map((note) => (
              <div key={note.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {note.isPinned && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium mb-1">
                        <Pin className="h-3 w-3" /> Pinned
                      </span>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      title={note.isPinned ? 'Unpin' : 'Pin'}
                      onClick={() => updateNote.mutate({ noteId: note.id, isPinned: !note.isPinned })}
                    >
                      <Pin className={`h-4 w-4 ${note.isPinned ? 'text-amber-600' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingNoteId(note.id);
                        setNoteContent(note.content);
                        setNoteDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteNote.mutate(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNoteId ? t('common.edit') : t('common.create')}</DialogTitle>
            <DialogDescription>
              {editingNoteId ? 'Update the note content.' : 'Add a note to this project.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Content</Label>
              <Textarea
                rows={5}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your note here…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button
              disabled={!noteContent.trim() || createNote.isPending || updateNote.isPending}
              onClick={async () => {
                if (editingNoteId) {
                  await updateNote.mutateAsync({ noteId: editingNoteId, content: noteContent });
                } else {
                  await createNote.mutateAsync({ content: noteContent });
                }
                setNoteDialogOpen(false);
              }}
            >
              {editingNoteId ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col overflow-visible">
          <DialogHeader>
            <DialogTitle>{editingTask ? t('common.edit') : t('common.create')}</DialogTitle>
            <DialogDescription>
              {editingTask ? t('projectForm.editDesc') : t('projectForm.newDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
          {/* Read-only metadata for existing tasks */}
          {editingTask && (
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border rounded-lg p-3 bg-muted/30">
              <div>
                <span className="font-medium">{t('tasks.createdBy')}:</span>{' '}
                {assigneeOptions.find((o) => o.value === editingTask.createdById)?.label ?? '—'}
              </div>
              <div>
                <span className="font-medium">{t('tasks.createdDate')}:</span>{' '}
                {new Date(editingTask.createdAt).toLocaleDateString()}
              </div>
              {editingTask.completedDate && (
                <div>
                  <span className="font-medium">{t('tasks.completedDate')}:</span>{' '}
                  {editingTask.completedDate}
                </div>
              )}
              <div>
                <span className="font-medium">{t('tasks.lastUpdated')}:</span>{' '}
                {new Date(editingTask.updatedAt).toLocaleString()}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">{t('projects.taskTitle')}</Label>
              <Input
                id="task-title"
                value={taskForm.title}
                onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={t('projects.taskTitle')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">{t('common.description')}</Label>
              <Textarea
                id="task-desc"
                rows={2}
                value={taskForm.description}
                onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2 overflow-visible">
              <Label>{t('tasks.assignee')}</Label>
              <Combobox
                options={assigneeOptions}
                value={taskForm.assigneeId}
                onChange={(v) => setTaskForm((f) => ({ ...f, assigneeId: v }))}
                placeholder={t('tasks.searchAssignee')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('common.status')}</Label>
                <Select
                  value={taskForm.status}
                  onValueChange={(v) => setTaskForm((f) => ({ ...f, status: v as TaskStatus }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(TaskStatus).map((s) => (
                      <SelectItem key={s} value={s}>{t(`statuses.${s}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('projects.priority')}</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(v) => setTaskForm((f) => ({ ...f, priority: v as Priority }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(Priority).map((p) => (
                      <SelectItem key={p} value={p}>{t(`priorities.${p}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-start">{t('tasks.startDate')}</Label>
                <Input
                  id="task-start"
                  type="date"
                  value={taskForm.startDate}
                  onChange={(e) => setTaskForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due">{t('tasks.requiredEnd')}</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Activity Timeline (only when editing) */}
            {editingTask && (
              <div className="border-t pt-4">
                <TaskActivityTimeline projectId={id!} taskId={editingTask.id} />
              </div>
            )}
          </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={handleTaskSubmit}
              disabled={!taskForm.title || createTask.isPending || updateTask.isPending}
            >
              {editingTask ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="overflow-visible">
          <DialogHeader>
            <DialogTitle>{t('projects.addMember')}</DialogTitle>
            <DialogDescription>{t('projects.addMemberDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="overflow-visible">
              <Label>{t('common.name')}</Label>
              <Combobox
                options={assigneeOptions}
                value={memberForm.userId}
                onChange={(v) => setMemberForm((f) => ({ ...f, userId: v }))}
                placeholder={t('tasks.searchAssignee')}
              />
            </div>
            <div>
              <Label>{t('projects.role')}</Label>
              <Select
                value={memberForm.role}
                onValueChange={(v) => setMemberForm((f) => ({ ...f, role: v as ProjectMemberRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ProjectMemberRole).map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button
              disabled={!memberForm.userId || addMember.isPending}
              onClick={async () => {
                await addMember.mutateAsync({
                  projectId: id!,
                  userId: memberForm.userId,
                  role: memberForm.role,
                });
                setMemberDialogOpen(false);
              }}
            >
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

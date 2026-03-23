import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjects, useUpdateProject } from '../../hooks/use-projects';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface LinkProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
}

export function LinkProjectsDialog({ open, onOpenChange, programId }: LinkProjectsDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const updateProject = useUpdateProject();
  const qc = useQueryClient();

  // Fetch projects that are NOT assigned to any program (or assigned to this one already)
  const projects = useProjects({ limit: 100, search: search || undefined });

  const unassigned = (projects.data?.data ?? []).filter(
    (p) => !p.programId || p.programId === programId,
  );

  function toggleProject(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleLink() {
    setSaving(true);
    try {
      await Promise.all(
        Array.from(selected).map((projectId) =>
          updateProject.mutateAsync({ id: projectId, programId }),
        ),
      );
      qc.invalidateQueries({ queryKey: ['programs'] });
      setSelected(new Set());
      setSearch('');
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('programs.linkProjects')}</DialogTitle>
          <DialogDescription>{t('programs.linkProjectsDesc')}</DialogDescription>
        </DialogHeader>

        <Input
          placeholder={t('projects.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
        />

        <div className="max-h-[300px] overflow-y-auto border rounded-md">
          {projects.isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">{t('common.loading')}</div>
          )}
          {unassigned.length === 0 && !projects.isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t('programs.noUnassignedProjects')}
            </div>
          )}
          {unassigned.map((proj) => {
            const alreadyLinked = proj.programId === programId;
            return (
              <label
                key={proj.id}
                className={`flex items-center gap-3 px-3 py-2 border-b last:border-0 hover:bg-muted/25 cursor-pointer ${alreadyLinked ? 'opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={alreadyLinked || selected.has(proj.id)}
                  disabled={alreadyLinked}
                  onChange={() => toggleProject(proj.id)}
                />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{proj.name}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{proj.code}</span>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleLink} disabled={saving || selected.size === 0}>
            {saving ? t('common.saving') : t('programs.linkSelected', { count: selected.size })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

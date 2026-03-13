import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SkillCategory } from '@bizops/shared';
import type { Skill } from '@bizops/shared';
import { useSkills, useCreateSkill, useUpdateSkill, useDeleteSkill } from '../hooks/use-skills';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { Plus } from 'lucide-react';

const categoryColors: Record<string, string> = {
  TECHNICAL: 'bg-blue-100 text-blue-700',
  MANAGEMENT: 'bg-purple-100 text-purple-700',
  DOMAIN: 'bg-green-100 text-green-700',
  SOFT_SKILL: 'bg-yellow-100 text-yellow-700',
  CERTIFICATION: 'bg-indigo-100 text-indigo-700',
};

export function SkillsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const skills = useSkills({ page, limit: 25, search: search || undefined });
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [form, setForm] = useState({
    name: '',
    category: SkillCategory.TECHNICAL,
    description: '',
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', category: SkillCategory.TECHNICAL, description: '' });
    setDialogOpen(true);
  };

  const openEdit = (s: Skill) => {
    setEditing(s);
    setForm({ name: s.name, category: s.category, description: s.description ?? '' });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const body = {
      name: form.name,
      category: form.category,
      description: form.description || undefined,
    };
    if (editing) {
      await updateSkill.mutateAsync({ id: editing.id, ...body });
    } else {
      await createSkill.mutateAsync(body);
    }
    setDialogOpen(false);
  };

  const meta = skills.data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('skills.title')}</h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> {t('skills.new')}
        </Button>
      </div>

      <Input
        placeholder={t('skills.search')}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="max-w-sm"
      />

      {skills.isLoading && (
        <div className="text-center text-muted-foreground py-12">{t('common.loading')}</div>
      )}

      {skills.data?.data && skills.data.data.length === 0 && (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          {t('skills.empty')}
        </div>
      )}

      {skills.data?.data && skills.data.data.length > 0 && (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">{t('common.name')}</th>
                <th className="text-left p-3 font-medium">{t('common.category')}</th>
                <th className="text-left p-3 font-medium">{t('common.description')}</th>
                <th className="text-right p-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {skills.data.data.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/25">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${categoryColors[s.category] ?? 'bg-gray-100 text-gray-700'}`}>
                      {t(`skills.categories.${s.category}`)}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{s.description ?? '—'}</td>
                  <td className="p-3 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(s)}>{t('common.edit')}</Button>
                    <Button variant="outline" size="sm" onClick={async () => {
                      if (confirm(`${t('common.delete')} "${s.name}"?`)) {
                        await deleteSkill.mutateAsync(s.id);
                      }
                    }}>{t('common.delete')}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('skills.pageInfo', { page: meta.page, totalPages: meta.totalPages, total: meta.total })}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('common.previous')}</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>{t('common.next')}</Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('skills.editTitle') : t('skills.newTitle')}</DialogTitle>
            <DialogDescription>
              {editing ? t('skills.editDesc') : t('skills.newDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{t('skills.nameLabel')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t('skills.namePlaceholder')}
              />
            </div>
            <div>
              <Label>{t('skills.categoryLabel')}</Label>
              <Select
                value={form.category}
                onValueChange={(val) => setForm((f) => ({ ...f, category: val as SkillCategory }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TECHNICAL">{t('skills.categories.TECHNICAL')}</SelectItem>
                  <SelectItem value="MANAGEMENT">{t('skills.categories.MANAGEMENT')}</SelectItem>
                  <SelectItem value="DOMAIN">{t('skills.categories.DOMAIN')}</SelectItem>
                  <SelectItem value="SOFT_SKILL">{t('skills.categories.SOFT_SKILL')}</SelectItem>
                  <SelectItem value="CERTIFICATION">{t('skills.categories.CERTIFICATION')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('skills.descLabel')}</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t('skills.descPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button disabled={!form.name} onClick={handleSubmit}>
              {editing ? t('skills.saveBtn') : t('skills.createBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

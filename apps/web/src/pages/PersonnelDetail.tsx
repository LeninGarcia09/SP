import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { ProficiencyLevel } from '@bizops/shared';
import { usePerson, useAssignmentsByPerson, useCreateAssignment } from '../hooks/use-personnel';
import { usePersonSkills, useSkills, useAssignPersonSkill, useUpdatePersonSkill, useRemovePersonSkill } from '../hooks/use-skills';
import { PersonFormDialog } from '../components/personnel/PersonFormDialog';
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

export function PersonnelDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const person = usePerson(id!);
  const assignments = useAssignmentsByPerson(id!);
  const personSkills = usePersonSkills(id!);
  const skillsCatalog = useSkills({ limit: 200 });
  const createAssignment = useCreateAssignment();
  const assignSkill = useAssignPersonSkill();
  const updatePersonSkill = useUpdatePersonSkill();
  const removePersonSkill = useRemovePersonSkill();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<{ personId: string; skillId: string; proficiency: string; yearsOfExperience: string; notes: string } | null>(null);
  const [skillForm, setSkillForm] = useState({
    skillId: '',
    proficiency: ProficiencyLevel.BEGINNER,
    yearsOfExperience: '',
    notes: '',
  });
  const [assignmentForm, setAssignmentForm] = useState({
    projectId: '',
    role: '',
    allocationPercent: '100',
    startDate: '',
    endDate: '',
  });

  if (person.isLoading) {
    return <div className="text-center text-muted-foreground py-12">{t('common.loading')}</div>;
  }

  if (person.isError || !person.data?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{t('personnel.notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/personnel')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {t('personnel.backTo')}
        </Button>
      </div>
    );
  }

  const p = person.data.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/personnel')}
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> {t('nav.personnel')}
          </button>
          <h2 className="text-2xl font-bold">{p.firstName} {p.lastName}</h2>
          <p className="text-sm text-muted-foreground mt-1">{p.jobTitle} · {p.email}</p>
        </div>
        <Button variant="outline" onClick={() => setEditDialogOpen(true)}>{t('common.edit')}</Button>
      </div>

      <PersonFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} person={p} />

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('personnel.employeeId')}</p>
          <p className="font-medium">{p.employeeId ?? '—'}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('common.status')}</p>
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            p.assignmentStatus === 'ON_BENCH' ? 'bg-yellow-100 text-yellow-700' :
            p.assignmentStatus === 'ON_PROJECT' ? 'bg-green-100 text-green-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {t(`statuses.${p.assignmentStatus}`)}
          </span>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('common.startDate')}</p>
          <p className="font-medium">{p.startDate}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('personnel.departmentId')}</p>
          <p className="font-medium font-mono text-xs">{p.departmentId}</p>
        </div>
      </div>

      {/* Skills Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{t('personnel.skills')}</h3>
          <Button size="sm" onClick={() => {
            setEditingSkill(null);
            setSkillForm({ skillId: '', proficiency: ProficiencyLevel.BEGINNER, yearsOfExperience: '', notes: '' });
            setSkillDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-1" /> {t('personnel.addSkill')}
          </Button>
        </div>

        {personSkills.isLoading && (
          <div className="rounded-lg border p-4 text-center text-muted-foreground">{t('personnel.loadingSkills')}</div>
        )}

        {personSkills.data?.data && personSkills.data.data.length === 0 && (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">
            {t('personnel.noSkills')}
          </div>
        )}

        {personSkills.data?.data && personSkills.data.data.length > 0 && (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t('personnel.skill')}</th>
                  <th className="text-left p-3 font-medium">{t('common.category')}</th>
                  <th className="text-left p-3 font-medium">{t('personnel.proficiency')}</th>
                  <th className="text-left p-3 font-medium">{t('personnel.years')}</th>
                  <th className="text-left p-3 font-medium">{t('common.notes')}</th>
                  <th className="text-right p-3 font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {personSkills.data.data.map((ps) => (
                  <tr key={ps.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{ps.skill?.name ?? ps.skillId}</td>
                    <td className="p-3 text-muted-foreground">{ps.skill?.category ? t(`skills.categories.${ps.skill.category}`) : '—'}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        ps.proficiency === 'EXPERT' ? 'bg-purple-100 text-purple-700' :
                        ps.proficiency === 'ADVANCED' ? 'bg-blue-100 text-blue-700' :
                        ps.proficiency === 'INTERMEDIATE' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {t(`proficiency.${ps.proficiency}`)}
                      </span>
                    </td>
                    <td className="p-3">{ps.yearsOfExperience ?? '—'}</td>
                    <td className="p-3 text-muted-foreground">{ps.notes ?? '—'}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingSkill({
                          personId: id!,
                          skillId: ps.skillId,
                          proficiency: ps.proficiency,
                          yearsOfExperience: ps.yearsOfExperience?.toString() ?? '',
                          notes: ps.notes ?? '',
                        });
                        setSkillForm({
                          skillId: ps.skillId,
                          proficiency: ps.proficiency,
                          yearsOfExperience: ps.yearsOfExperience?.toString() ?? '',
                          notes: ps.notes ?? '',
                        });
                        setSkillDialogOpen(true);
                      }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={async () => {
                        if (confirm(`${t('common.delete')} ${ps.skill?.name ?? ''}?`)) {
                          await removePersonSkill.mutateAsync({ personId: id!, skillId: ps.skillId });
                        }
                      }}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {p.availabilityNotes && (
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('personnel.availabilityNotes')}</p>
          <p className="text-sm whitespace-pre-wrap">{p.availabilityNotes}</p>
        </div>
      )}

      {/* Assignments Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{t('personnel.projectAssignments')}</h3>
          <Button size="sm" onClick={() => {
            setAssignmentForm({ projectId: '', role: '', allocationPercent: '100', startDate: '', endDate: '' });
            setAssignmentDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-1" /> {t('personnel.addAssignment')}
          </Button>
        </div>

        {assignments.isLoading && (
          <div className="rounded-lg border p-4 text-center text-muted-foreground">{t('personnel.loadingAssignments')}</div>
        )}

        {assignments.data?.data && assignments.data.data.length === 0 && (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">
            {t('personnel.noAssignments')}
          </div>
        )}

        {assignments.data?.data && assignments.data.data.length > 0 && (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t('personnel.projectId')}</th>
                  <th className="text-left p-3 font-medium">{t('common.role')}</th>
                  <th className="text-left p-3 font-medium">{t('personnel.allocation')}</th>
                  <th className="text-left p-3 font-medium">{t('personnel.start')}</th>
                  <th className="text-left p-3 font-medium">{t('personnel.end')}</th>
                  <th className="text-left p-3 font-medium">{t('common.active')}</th>
                </tr>
              </thead>
              <tbody>
                {assignments.data.data.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b last:border-0 hover:bg-muted/25 cursor-pointer"
                    onClick={() => navigate(`/projects/${a.projectId}`)}
                  >
                    <td className="p-3 font-mono text-xs">{a.projectId}</td>
                    <td className="p-3">{a.role}</td>
                    <td className="p-3">{a.allocationPercent}%</td>
                    <td className="p-3">{a.startDate}</td>
                    <td className="p-3">{a.endDate ?? '—'}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        a.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {a.isActive ? t('common.yes') : t('common.no')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('personnel.newAssignment')}</DialogTitle>
            <DialogDescription>{t('personnel.assignDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{t('personnel.projectId')}</Label>
              <Input
                value={assignmentForm.projectId}
                onChange={(e) => setAssignmentForm((f) => ({ ...f, projectId: e.target.value }))}
                placeholder="UUID"
              />
            </div>
            <div>
              <Label>{t('common.role')}</Label>
              <Input
                value={assignmentForm.role}
                onChange={(e) => setAssignmentForm((f) => ({ ...f, role: e.target.value }))}
                placeholder={t('personnel.rolePlaceholder')}
              />
            </div>
            <div>
              <Label>{t('personnel.allocationPercent')}</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={assignmentForm.allocationPercent}
                onChange={(e) => setAssignmentForm((f) => ({ ...f, allocationPercent: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('common.startDate')}</Label>
                <Input
                  type="date"
                  value={assignmentForm.startDate}
                  onChange={(e) => setAssignmentForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>{t('common.endDate')}</Label>
                <Input
                  type="date"
                  value={assignmentForm.endDate}
                  onChange={(e) => setAssignmentForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button
              disabled={!assignmentForm.projectId || !assignmentForm.role || !assignmentForm.startDate}
              onClick={async () => {
                await createAssignment.mutateAsync({
                  personId: id!,
                  projectId: assignmentForm.projectId,
                  role: assignmentForm.role,
                  allocationPercent: Number(assignmentForm.allocationPercent),
                  startDate: assignmentForm.startDate,
                  endDate: assignmentForm.endDate || undefined,
                });
                setAssignmentDialogOpen(false);
              }}
            >
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skill Assignment / Edit Dialog */}
      <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSkill ? t('skills.editTitle') : t('personnel.addSkill')}</DialogTitle>
            <DialogDescription>
              {editingSkill ? t('skills.editDesc') : t('skills.newDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editingSkill && (
              <div>
                <Label>{t('personnel.skill')}</Label>
                <Select
                  value={skillForm.skillId}
                  onValueChange={(val) => setSkillForm((f) => ({ ...f, skillId: val }))}
                >
                  <SelectTrigger><SelectValue placeholder={t('personnel.skill')} /></SelectTrigger>
                  <SelectContent>
                    {skillsCatalog.data?.data?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({t(`skills.categories.${s.category}`)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>{t('personnel.proficiency')}</Label>
              <Select
                value={skillForm.proficiency}
                onValueChange={(val) => setSkillForm((f) => ({ ...f, proficiency: val as ProficiencyLevel }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">{t('proficiency.BEGINNER')}</SelectItem>
                  <SelectItem value="INTERMEDIATE">{t('proficiency.INTERMEDIATE')}</SelectItem>
                  <SelectItem value="ADVANCED">{t('proficiency.ADVANCED')}</SelectItem>
                  <SelectItem value="EXPERT">{t('proficiency.EXPERT')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('personnel.years')}</Label>
              <Input
                type="number"
                min={0}
                value={skillForm.yearsOfExperience}
                onChange={(e) => setSkillForm((f) => ({ ...f, yearsOfExperience: e.target.value }))}
                placeholder={t('common.optional')}
              />
            </div>
            <div>
              <Label>{t('common.notes')}</Label>
              <Input
                value={skillForm.notes}
                onChange={(e) => setSkillForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder={t('common.optional')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkillDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button
              disabled={!editingSkill && !skillForm.skillId}
              onClick={async () => {
                const payload = {
                  proficiency: skillForm.proficiency,
                  yearsOfExperience: skillForm.yearsOfExperience ? Number(skillForm.yearsOfExperience) : undefined,
                  notes: skillForm.notes || undefined,
                };
                if (editingSkill) {
                  await updatePersonSkill.mutateAsync({
                    personId: id!,
                    skillId: editingSkill.skillId,
                    ...payload,
                  });
                } else {
                  await assignSkill.mutateAsync({
                    personId: id!,
                    skillId: skillForm.skillId,
                    ...payload,
                  });
                }
                setSkillDialogOpen(false);
              }}
            >
              {editingSkill ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

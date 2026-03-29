import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ForecastCategory } from '@telnub/shared';
import {
  usePipelines,
  useCreatePipeline,
  useUpdatePipeline,
  useDeletePipeline,
  useCreatePipelineStage,
  useUpdatePipelineStage,
  useDeletePipelineStage,
} from '../hooks/use-pipelines';
import { usePermissions } from '../hooks/use-permissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Plus, Pencil, Trash2, Star, GripVertical } from 'lucide-react';
import type { SalesPipeline, PipelineStage } from '@telnub/shared';

// ── Schemas ──

const pipelineSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().or(z.literal('')),
  isDefault: z.boolean().optional(),
});

const stageSchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.coerce.number().min(0),
  defaultProbability: z.coerce.number().min(0).max(100),
  forecastCategory: z.nativeEnum(ForecastCategory),
  isClosed: z.boolean().optional(),
  isWon: z.boolean().optional(),
  color: z.string().max(7).optional().or(z.literal('')),
});

type PipelineFormValues = z.infer<typeof pipelineSchema>;
type StageFormValues = z.infer<typeof stageSchema>;

export function PipelinesPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { data, isLoading, error } = usePipelines({ limit: 50 });
  const pipelines = data?.data ?? [];

  const [pipelineDialogOpen, setPipelineDialogOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<SalesPipeline | null>(null);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);

  const deletePipeline = useDeletePipeline();
  const deleteStage = useDeletePipelineStage();

  const handleEditPipeline = (p: SalesPipeline) => {
    setEditingPipeline(p);
    setPipelineDialogOpen(true);
  };

  const handleAddStage = (pipelineId: string) => {
    setActivePipelineId(pipelineId);
    setEditingStage(null);
    setStageDialogOpen(true);
  };

  const handleEditStage = (stage: PipelineStage) => {
    setActivePipelineId(stage.pipelineId);
    setEditingStage(stage);
    setStageDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('pipelines.title')}</h1>
        {can('pipelines.create') && (
          <Button onClick={() => { setEditingPipeline(null); setPipelineDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> {t('pipelines.new')}
          </Button>
        )}
      </div>

      {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}
      {error && <p className="text-destructive">{t('pipelines.error')}</p>}

      {!isLoading && !error && pipelines.length === 0 && (
        <p className="text-muted-foreground">{t('pipelines.empty')}</p>
      )}

      <div className="space-y-6">
        {pipelines.map((pipeline) => (
          <div key={pipeline.id} className="rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">{pipeline.name}</h2>
                {pipeline.isDefault && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-medium">
                    <Star className="h-3 w-3" /> {t('pipelines.defaultPipeline')}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {t('pipelines.stageCount', { count: pipeline.stages?.length ?? 0 })}
                </span>
              </div>
              {can('pipelines.update') && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditPipeline(pipeline)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!pipeline.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { if (confirm(t('common.delete') + '?')) deletePipeline.mutate(pipeline.id); }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="p-4">
              {pipeline.description && <p className="text-sm text-muted-foreground mb-4">{pipeline.description}</p>}

              {(!pipeline.stages || pipeline.stages.length === 0) ? (
                <p className="text-sm text-muted-foreground">{t('pipelines.noStages')}</p>
              ) : (
                <div className="space-y-2">
                  {pipeline.stages.map((stage) => (
                    <div key={stage.id} className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/30">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      {stage.color && (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{stage.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {stage.defaultProbability}% · {stage.forecastCategory}
                          </span>
                          {stage.isClosed && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">Closed</span>
                          )}
                          {stage.isWon && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">Won</span>
                          )}
                        </div>
                      </div>
                      {can('pipelines.update') && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditStage(stage)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { if (confirm(t('common.delete') + '?')) deleteStage.mutate(stage.id); }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {can('pipelines.update') && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => handleAddStage(pipeline.id)}>
                  <Plus className="h-4 w-4 mr-1" /> {t('pipelines.addStage')}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Dialog */}
      <PipelineFormDialog
        open={pipelineDialogOpen}
        onOpenChange={setPipelineDialogOpen}
        pipeline={editingPipeline}
      />

      {/* Stage Dialog */}
      <StageFormDialog
        open={stageDialogOpen}
        onOpenChange={setStageDialogOpen}
        pipelineId={activePipelineId}
        stage={editingStage}
      />
    </div>
  );
}

// ── Pipeline Dialog ──

function PipelineFormDialog({ open, onOpenChange, pipeline }: { open: boolean; onOpenChange: (o: boolean) => void; pipeline: SalesPipeline | null }) {
  const isEdit = !!pipeline;
  const { t } = useTranslation();
  const createMut = useCreatePipeline();
  const updateMut = useUpdatePipeline();

  const form = useForm<PipelineFormValues>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: pipeline
      ? { name: pipeline.name, description: pipeline.description ?? '', isDefault: pipeline.isDefault }
      : { name: '', description: '', isDefault: false },
  });

  const onSubmit = (values: PipelineFormValues) => {
    if (isEdit) {
      updateMut.mutate({ id: pipeline!.id, ...values }, {
        onSuccess: () => { onOpenChange(false); form.reset(); },
      });
    } else {
      createMut.mutate(values, {
        onSuccess: () => { onOpenChange(false); form.reset(); },
      });
    }
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('pipelineForm.editTitle') : t('pipelineForm.newTitle')}</DialogTitle>
          <DialogDescription>{isEdit ? t('pipelineForm.editDesc') : t('pipelineForm.newDesc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>{t('pipelineForm.nameLabel')}</Label>
            <Input {...form.register('name')} placeholder={t('pipelineForm.namePlaceholder')} />
          </div>
          <div>
            <Label>{t('pipelineForm.descLabel')}</Label>
            <Input {...form.register('description')} placeholder={t('pipelineForm.descPlaceholder')} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isDefault" {...form.register('isDefault')} className="rounded" />
            <Label htmlFor="isDefault">{t('pipelineForm.isDefaultLabel')}</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('common.saving') : isEdit ? t('pipelineForm.saveBtn') : t('pipelineForm.createBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Stage Dialog ──

function StageFormDialog({ open, onOpenChange, pipelineId, stage }: { open: boolean; onOpenChange: (o: boolean) => void; pipelineId: string | null; stage: PipelineStage | null }) {
  const isEdit = !!stage;
  const { t } = useTranslation();
  const createMut = useCreatePipelineStage();
  const updateMut = useUpdatePipelineStage();

  const form = useForm<StageFormValues>({
    resolver: zodResolver(stageSchema),
    defaultValues: stage
      ? {
          name: stage.name,
          sortOrder: stage.sortOrder,
          defaultProbability: stage.defaultProbability,
          forecastCategory: stage.forecastCategory,
          isClosed: stage.isClosed,
          isWon: stage.isWon,
          color: stage.color ?? '',
        }
      : {
          name: '',
          sortOrder: 0,
          defaultProbability: 0,
          forecastCategory: ForecastCategory.PIPELINE,
          isClosed: false,
          isWon: false,
          color: '',
        },
  });

  const onSubmit = (values: StageFormValues) => {
    const payload: Record<string, unknown> = { ...values };
    if (payload.color === '') delete payload.color;

    if (isEdit) {
      updateMut.mutate({ stageId: stage!.id, ...payload }, {
        onSuccess: () => { onOpenChange(false); form.reset(); },
      });
    } else if (pipelineId) {
      createMut.mutate({ pipelineId, ...payload }, {
        onSuccess: () => { onOpenChange(false); form.reset(); },
      });
    }
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('stageForm.editTitle') : t('stageForm.newTitle')}</DialogTitle>
          <DialogDescription>{isEdit ? '' : t('stageForm.newDesc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>{t('stageForm.nameLabel')}</Label>
              <Input {...form.register('name')} placeholder={t('stageForm.namePlaceholder')} />
            </div>
            <div>
              <Label>{t('stageForm.sortOrderLabel')}</Label>
              <Input type="number" {...form.register('sortOrder')} />
            </div>
            <div>
              <Label>{t('stageForm.probabilityLabel')}</Label>
              <Input type="number" {...form.register('defaultProbability')} />
            </div>
            <div>
              <Label>{t('stageForm.forecastLabel')}</Label>
              <Select
                value={form.watch('forecastCategory')}
                onValueChange={(v) => form.setValue('forecastCategory', v as ForecastCategory)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(ForecastCategory).map((v) => (
                    <SelectItem key={v} value={v}>{v.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('stageForm.colorLabel')}</Label>
              <Input {...form.register('color')} placeholder="#3B82F6" maxLength={7} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isClosed" {...form.register('isClosed')} className="rounded" />
              <Label htmlFor="isClosed">{t('stageForm.isClosedLabel')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isWon" {...form.register('isWon')} className="rounded" />
              <Label htmlFor="isWon">{t('stageForm.isWonLabel')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('common.saving') : isEdit ? t('stageForm.saveBtn') : t('stageForm.createBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

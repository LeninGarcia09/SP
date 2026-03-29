import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, UserPlus, Star } from 'lucide-react';
import { useResourceMatches } from '../../hooks/use-personnel';
import { useSkills } from '../../hooks/use-skills';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';

interface ResourceFinderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign?: (personId: string) => void;
}

export function ResourceFinder({ open, onOpenChange, onAssign }: ResourceFinderProps) {
  const { t } = useTranslation();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [minAllocation, setMinAllocation] = useState<number>(20);

  const skillsQuery = useSkills({ limit: 100 });
  const matchQuery = useResourceMatches(selectedSkills, minAllocation);

  const allSkills = skillsQuery.data?.data ?? [];
  const filteredSkills = allSkills.filter(
    (s) => s.name.toLowerCase().includes(skillSearch.toLowerCase()) && !selectedSkills.includes(s.name),
  );
  const matches = matchQuery.data?.data?.matches ?? [];

  function toggleSkill(name: string) {
    setSelectedSkills((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            {t('resourceFinder.title')}
          </DialogTitle>
          <DialogDescription>{t('resourceFinder.desc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Skill selector */}
          <div>
            <label className="text-sm font-medium">{t('resourceFinder.skills')}</label>
            <Input
              placeholder={t('resourceFinder.searchSkills')}
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              className="mt-1"
            />
            {/* Selected skills */}
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedSkills.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSkill(s)}
                    className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 hover:bg-blue-200"
                  >
                    {s} ×
                  </button>
                ))}
              </div>
            )}
            {/* Available skills dropdown */}
            {skillSearch && filteredSkills.length > 0 && (
              <div className="border rounded-md mt-1 max-h-32 overflow-y-auto">
                {filteredSkills.slice(0, 10).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { toggleSkill(s.name); setSkillSearch(''); }}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    {s.name}
                    <span className="text-xs text-muted-foreground ml-2">{s.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Min allocation filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">{t('resourceFinder.minAvailable')}</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={minAllocation}
              onChange={(e) => setMinAllocation(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>

          {/* Results */}
          {selectedSkills.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">
                {t('resourceFinder.results', { count: matches.length })}
              </h4>
              {matchQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
              ) : matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('resourceFinder.noMatches')}</p>
              ) : (
                <div className="space-y-2">
                  {matches.map((m) => (
                    <div key={m.person.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {m.person.firstName} {m.person.lastName}
                          </span>
                          <span className="text-xs bg-blue-50 text-blue-700 rounded px-1.5 py-0.5">
                            {m.matchScore}% {t('resourceFinder.match')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{m.person.jobTitle} · {m.person.email}</p>
                        <div className="flex flex-wrap gap-1">
                          {m.matchedSkills.map((s) => (
                            <span key={s} className="inline-flex items-center gap-0.5 text-xs bg-green-50 text-green-700 rounded px-1.5 py-0.5">
                              <Star className="h-2.5 w-2.5" /> {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-xs text-muted-foreground">
                          {t('resourceFinder.allocated')}: {m.currentAllocation}%
                        </div>
                        <div className={`text-xs font-medium ${m.availablePercent > 50 ? 'text-green-600' : m.availablePercent > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                          {t('resourceFinder.available')}: {m.availablePercent}%
                        </div>
                        {onAssign && m.availablePercent > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => onAssign(m.person.id)}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            {t('resourceFinder.assign')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

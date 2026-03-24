import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { CostForecast } from '@telnub/shared';

interface CostForecastCardProps {
  forecast: CostForecast;
}

export function CostForecastCard({ forecast }: CostForecastCardProps) {
  const { t } = useTranslation();
  const { budget, actualCost, eac, etc, vac, cpi, remainingHours, totalEstimated, totalActual, projectedOverrun } = forecast;

  const cpiColor = cpi >= 1 ? 'text-green-600' : cpi >= 0.9 ? 'text-amber-600' : 'text-red-600';
  const vacColor = vac >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          {projectedOverrun ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : (
            <TrendingUp className="h-4 w-4 text-green-500" />
          )}
          {t('forecast.title')}
        </h4>
        {projectedOverrun && (
          <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">
            {t('forecast.overrun')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{t('forecast.eac')}</p>
          <p className="font-medium">${eac.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{t('forecast.eacDesc')}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('forecast.etc')}</p>
          <p className="font-medium">${etc.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{t('forecast.etcDesc')}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('forecast.vac')}</p>
          <p className={`font-medium ${vacColor}`}>
            {vac >= 0 ? '' : '-'}${Math.abs(vac).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">{t('forecast.vacDesc')}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('forecast.cpi')}</p>
          <p className={`font-medium ${cpiColor}`}>{cpi.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">
            {cpi >= 1 ? (
              <span className="flex items-center gap-1"><TrendingDown className="h-3 w-3" /> {t('forecast.underBudget')}</span>
            ) : (
              <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {t('forecast.overBudget')}</span>
            )}
          </p>
        </div>
      </div>

      {/* Progress bar: actual → EAC → budget */}
      {budget > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('forecast.spent')}: ${actualCost.toLocaleString()}</span>
            <span>{t('common.budget')}: ${budget.toLocaleString()}</span>
          </div>
          <div className="relative w-full bg-gray-200 rounded-full h-3">
            {/* EAC projection (lighter) */}
            <div
              className="absolute h-3 rounded-full bg-blue-200"
              style={{ width: `${Math.min((eac / budget) * 100, 100)}%` }}
            />
            {/* Actual spend (solid) */}
            <div
              className={`relative h-3 rounded-full ${projectedOverrun ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min((actualCost / budget) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('forecast.actualPct', { pct: budget > 0 ? Math.round((actualCost / budget) * 100) : 0 })}</span>
            <span>{t('forecast.eacPct', { pct: budget > 0 ? Math.round((eac / budget) * 100) : 0 })}</span>
          </div>
        </div>
      )}

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>{t('forecast.hoursRemaining')}: {remainingHours}h</span>
        <span>{t('forecast.hoursProgress')}: {totalActual}h / {totalEstimated}h</span>
      </div>
    </div>
  );
}

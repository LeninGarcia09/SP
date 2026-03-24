import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Square, Clock } from 'lucide-react';

const TIMER_STORAGE_KEY = 'telnub-task-timer';

interface TimerState {
  taskId: string;
  taskTitle: string;
  projectId: string;
  startedAt: number; // unix ms
}

function getStoredTimer(): TimerState | null {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

interface TaskTimerButtonProps {
  taskId: string;
  taskTitle: string;
  projectId: string;
  onStop: (hours: number) => void;
}

/** Compact start/stop button shown on each task row */
export function TaskTimerButton({ taskId, taskTitle, projectId, onStop }: TaskTimerButtonProps) {
  const { t } = useTranslation();
  const [timer, setTimer] = useState<TimerState | null>(getStoredTimer);
  const [elapsed, setElapsed] = useState(0);

  const isRunningForThis = timer?.taskId === taskId;
  const isRunningForOther = timer != null && timer.taskId !== taskId;

  useEffect(() => {
    if (!isRunningForThis || !timer) return;
    const iv = setInterval(() => setElapsed(Date.now() - timer.startedAt), 1000);
    setElapsed(Date.now() - timer.startedAt);
    return () => clearInterval(iv);
  }, [isRunningForThis, timer]);

  const handleStart = useCallback(() => {
    const state: TimerState = { taskId, taskTitle, projectId, startedAt: Date.now() };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
    setTimer(state);
    setElapsed(0);
  }, [taskId, taskTitle, projectId]);

  const handleStop = useCallback(() => {
    if (!timer) return;
    const hours = Math.round(((Date.now() - timer.startedAt) / 3600000) * 100) / 100;
    localStorage.removeItem(TIMER_STORAGE_KEY);
    setTimer(null);
    setElapsed(0);
    onStop(hours);
  }, [timer, onStop]);

  if (isRunningForThis) {
    return (
      <button
        onClick={handleStop}
        className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5 hover:bg-red-200 transition-colors"
        title={t('timer.stop')}
      >
        <Square className="h-3 w-3" />
        {formatDuration(elapsed)}
      </button>
    );
  }

  return (
    <button
      onClick={handleStart}
      disabled={isRunningForOther}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
      title={isRunningForOther ? t('timer.otherRunning') : t('timer.start')}
    >
      <Play className="h-3 w-3" />
    </button>
  );
}

/** Floating bar shown in the navbar when timer is active */
export function ActiveTimerBar() {
  const [timer, setTimer] = useState<TimerState | null>(getStoredTimer);
  const [elapsed, setElapsed] = useState(0);

  // Listen for storage changes (timer started/stopped from another component)
  useEffect(() => {
    const handler = () => setTimer(getStoredTimer());
    window.addEventListener('storage', handler);
    // Also poll for same-tab changes
    const iv = setInterval(() => {
      const current = getStoredTimer();
      setTimer((prev) => {
        if (prev?.taskId !== current?.taskId || prev?.startedAt !== current?.startedAt) return current;
        return prev;
      });
    }, 1000);
    return () => {
      window.removeEventListener('storage', handler);
      clearInterval(iv);
    };
  }, []);

  useEffect(() => {
    if (!timer) { setElapsed(0); return; }
    const iv = setInterval(() => setElapsed(Date.now() - timer.startedAt), 1000);
    setElapsed(Date.now() - timer.startedAt);
    return () => clearInterval(iv);
  }, [timer]);

  if (!timer) return null;

  return (
    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs font-medium">
      <Clock className="h-3 w-3 animate-pulse" />
      <span className="max-w-[140px] truncate">{timer.taskTitle}</span>
      <span className="font-mono">{formatDuration(elapsed)}</span>
    </div>
  );
}

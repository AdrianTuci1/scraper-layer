import { intervalToDuration } from 'date-fns';
import type { Period } from '@/lib/types';

export function datesToDurationString(end: Date | null, start: Date | null) {
  if (!start || !end) return null;

  const timeElapsed = end.getTime() - start.getTime();
  if (timeElapsed < 1000) {
    return `${timeElapsed} ms`;
  }

  const duration = intervalToDuration({
    start: 0,
    end: timeElapsed,
  });

  return `${duration.hours || 0}h ${duration.minutes || 0}m ${
    duration.seconds || 0
  }s`;
}

export function getPhasesTotalCost(phases: Array<{ creditsConsumed?: number | null }>) {
  return phases.reduce((acc, phase) => acc + (phase.creditsConsumed || 0), 0);
}

export function periodToDateRange(period: Period) {
  const startDate = new Date(period.year, period.month, 1);
  const endDate = new Date(period.year, period.month + 1, 0);

  return { startDate, endDate };
}

export function getAppUrl(path: string) {
  const appUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';
  return `${appUrl}/${path}`;
}


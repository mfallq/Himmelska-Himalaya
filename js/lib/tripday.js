// Which stage is it today? Counted in Nepal time, so a phone that is still on
// home time (or has just landed) agrees with the trail.
import { parseISO, daysBetween } from '../util.js';
import { TRIP } from '../content/itinerary.js';

const NEPAL = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit' });

/** Today's calendar date in Nepal, as a local Date at midnight. */
export const nepalToday = (now = new Date()) => parseISO(NEPAL.format(now));

/**
 * Where the traveller is in the plan.
 * `shift` is the number of days the plan has slipped (a rest day added, weather).
 * Returns { phase: 'nodates' | 'before' | 'during' | 'after', day?, daysTo? }.
 */
export function tripState(settings, now = new Date()) {
  const start = parseISO(settings.startDate);
  if (!start) return { phase: 'nodates' };
  const elapsed = daysBetween(start, nepalToday(now)); // 0 on the arrival day
  if (elapsed < 0) return { phase: 'before', daysTo: -elapsed, start };
  const shift = Math.max(0, Number(settings.shift) || 0);
  const day = elapsed + 1 - shift;
  if (day > TRIP.days) return { phase: 'after', start };
  return { phase: 'during', day: Math.max(1, day), shift, start };
}

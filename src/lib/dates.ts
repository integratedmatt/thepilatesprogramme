import type { CourseDate, DateStatus } from './types';

export function statusLabel(d: Pick<CourseDate, 'status' | 'spacesLeft'>): string {
  switch (d.status) {
    case 'open':
      return 'Open';
    case 'few-spaces':
      return d.spacesLeft ? `${d.spacesLeft} ${d.spacesLeft === 1 ? 'space' : 'spaces'} left` : 'Few spaces left';
    case 'full':
      return 'Full';
    case 'waitlist':
      return 'Join waitlist';
  }
}

export function statusClass(status: DateStatus): string {
  return { open: 'pill-open', 'few-spaces': 'pill-few', full: 'pill-full', waitlist: 'pill-waitlist' }[status];
}

export function isBookable(status: DateStatus): boolean {
  return status === 'open' || status === 'few-spaces';
}

export function locationLabel(d: Pick<CourseDate, 'location' | 'locationName'>): string {
  if (d.locationName) return d.locationName;
  return d.location === 'partner-studio' ? 'Partner studio' : 'Altrincham training centre';
}

export function dayPatternLabel(p: CourseDate['dayPattern']): string {
  return p === 'weekend' ? 'Weekends' : 'Weekdays';
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/** Day names the course actually runs on, from its start and end dates (consecutive days). */
export function courseDays(d: Pick<CourseDate, 'startDate' | 'endDate'>): string[] {
  const days: string[] = [];
  const end = new Date(`${d.endDate || d.startDate}T12:00:00Z`);
  for (let t = new Date(`${d.startDate}T12:00:00Z`); t <= end && days.length < 7; t.setUTCDate(t.getUTCDate() + 1)) days.push(DAY_NAMES[t.getUTCDay()]);
  return days;
}
/** "Weekdays", "Weekends", or the actual span (e.g. "Friday to Saturday") when it mixes both. */
export function daysLabel(d: Pick<CourseDate, 'startDate' | 'endDate' | 'dayPattern'>): string {
  const days = courseDays(d);
  if (days.length === 1) return days[0];
  const weekend = days.filter((x) => x === 'Saturday' || x === 'Sunday').length;
  if (weekend === 0) return 'Weekdays';
  if (weekend === days.length) return 'Weekends';
  return `${days[0]} to ${days[days.length - 1]}`;
}

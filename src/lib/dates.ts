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

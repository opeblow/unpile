// Small local-date helpers. Everything is a plain "yyyy-mm-dd" string in the person's own timezone.

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  c.setDate(c.getDate() + n);
  return c;
}

/** Whole days from `now` to `iso`. Negative = overdue. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = fromISO(iso).getTime();
  return Math.round((b - a) / 86_400_000);
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function dueLabel(iso: string, now: Date = new Date()): string {
  const n = daysUntil(iso, now);
  if (n < -1) return `${-n} days overdue`;
  if (n === -1) return 'Was due yesterday';
  if (n === 0) return 'Due today';
  if (n === 1) return 'Due tomorrow';
  if (n < 7) {
    const name = WEEKDAYS[fromISO(iso).getDay()];
    return `Due ${name[0].toUpperCase()}${name.slice(1)}`;
  }
  const d = fromISO(iso);
  return `Due ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
}

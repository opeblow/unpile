import type { ReactNode } from 'react';
import { daysUntil, dueLabel } from '../lib/dates';
import type { Energy, Task } from '../lib/types';

export const ENERGY_LABEL: Record<Energy, string> = { low: 'Running low', medium: 'Okay', high: 'Sharp' };
const ENERGY_LEVEL: Record<Energy, number> = { low: 1, medium: 2, high: 3 };
export const ENERGY_TASK_LABEL: Record<Energy, string> = { low: 'Light', medium: 'Some focus', high: 'Deep focus' };

export function Bars({ level, label }: { level: number; label?: string }) {
  return (
    <span className="bars" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {[1, 2, 3].map((i) => (
        <i key={i} className={i <= level ? 'on' : ''} />
      ))}
    </span>
  );
}

export function EnergyBars({ energy }: { energy: Energy }) {
  return <Bars level={ENERGY_LEVEL[energy]} />;
}

interface SegProps<T extends string | number> {
  legend: string;
  name: string;
  value: T;
  options: Array<{ value: T; label: ReactNode; aria?: string }>;
  onChange: (v: T) => void;
  hideLegend?: boolean;
}

/** Radio-group pills: real radios, so arrow keys and screen readers just work. */
export function Segmented<T extends string | number>({ legend, name, value, options, onChange, hideLegend }: SegProps<T>) {
  return (
    <fieldset className="seg">
      <legend className={hideLegend ? 'sr-only' : undefined}>{legend}</legend>
      {options.map((o) => (
        <label className="seg-opt" key={String(o.value)}>
          <input
            type="radio"
            name={name}
            checked={o.value === value}
            onChange={() => onChange(o.value)}
            aria-label={o.aria}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function minutesLabel(m: number): string {
  if (m < 60) return `~${m} min`;
  const h = m / 60;
  return `~${Number.isInteger(h) ? h : h.toFixed(1)} hr`;
}

export function TaskChips({ task, parentDue, now = new Date() }: { task: Task; parentDue?: string; now?: Date }) {
  const due = task.due ?? parentDue;
  const d = due ? daysUntil(due, now) : undefined;
  return (
    <>
      {task.urgent && <span className="chip chip-due">Urgent</span>}
      {due && <span className={`chip ${d! <= 1 ? 'chip-due' : ''}`}>{dueLabel(due, now)}</span>}
      <span className="chip">{minutesLabel(task.minutes)}</span>
      <span className="chip">
        <EnergyBars energy={task.energy} /> {ENERGY_TASK_LABEL[task.energy]}
      </span>
      {task.tags.map((t) => (
        <span className="chip" key={t}>
          #{t}
        </span>
      ))}
    </>
  );
}

export function PileMark({ size = 30 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="10" y="44" width="44" height="9" rx="4.5" fill="currentColor" opacity=".16" />
      <rect x="15" y="33" width="34" height="9" rx="4.5" fill="currentColor" opacity=".32" />
      <rect x="21" y="16" width="22" height="12" rx="6" fill="var(--accent)" />
    </svg>
  );
}

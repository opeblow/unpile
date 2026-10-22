// Writes a short, plain-language progress update the person can send to a tutor, teammate or parent.
import { rank } from './pick';
import { dueLabel } from './dates';
import type { Session, Task } from './types';

export type Tone = 'friendly' | 'formal';
export type Window = 'today' | 'week';

export interface UpdateOptions {
  tasks: Task[];
  session: Session;
  tone: Tone;
  window: Window;
  to: string;
  from: string;
  help: string;
  now?: Date;
}

function startOf(window: Window, now: Date): number {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (window === 'week') d.setDate(d.getDate() - 6);
  return d.getTime();
}

export function buildUpdate(o: UpdateOptions): string {
  const now = o.now ?? new Date();
  const since = startOf(o.window, now);
  const byId = new Map(o.tasks.map((t) => [t.id, t]));

  // Report finished top-level tasks, plus steps whose parent isn't finished yet (so progress still shows).
  const done = o.tasks.filter((t) => {
    if (t.status !== 'done' || (t.doneAt ?? 0) < since) return false;
    if (!t.parentId) return true;
    return byId.get(t.parentId)?.status !== 'done';
  });

  const inProgress = o.tasks.filter((t) => t.status === 'split');
  const next = rank(o.tasks, o.session, now)
    .filter((p) => !p.task.parentId)
    .slice(0, 3)
    .map((p) => p.task);
  const parked = o.tasks.filter((t) => t.status === 'parked');

  const label = (t: Task) => {
    const parent = t.parentId ? byId.get(t.parentId) : undefined;
    return parent ? `${parent.text}: ${t.text.charAt(0).toLowerCase()}${t.text.slice(1)}` : t.text;
  };
  const progress = (t: Task) => {
    const kids = o.tasks.filter((k) => k.parentId === t.id);
    const d = kids.filter((k) => k.status === 'done').length;
    const due = t.due ? ` (${dueLabel(t.due, now).toLowerCase()})` : '';
    return `${t.text} — ${d} of ${kids.length} steps done${due}`;
  };

  const formal = o.tone === 'formal';
  const when = o.window === 'today' ? 'today' : 'this week';
  const lines: string[] = [];
  const to = o.to.trim();

  lines.push(formal ? `Hello${to ? ` ${to}` : ''},` : `Hi${to ? ` ${to}` : ''}!`);
  lines.push(formal ? `Here is a short update on my progress ${when}.` : `Quick update on where I'm at ${when}:`);
  lines.push('');

  const section = (title: string, items: string[]) => {
    if (items.length === 0) return;
    lines.push(title);
    for (const i of items) lines.push(`• ${i}`);
    lines.push('');
  };

  section(formal ? 'Completed:' : 'Done ✓', done.map(label));
  section(formal ? 'In progress:' : 'Working on', inProgress.map(progress));
  section(formal ? 'Next:' : 'Up next', next.filter((t) => !inProgress.includes(t)).map((t) => t.text));
  section(formal ? 'On hold for now:' : 'Parked for now', parked.map((t) => t.text));

  if (done.length === 0 && inProgress.length === 0) {
    lines.push(formal ? 'I have planned my work and am starting on it now.' : "I've sorted out my list and I'm starting now.");
    lines.push('');
  }

  const help = o.help.trim();
  if (help) {
    lines.push(formal ? `I would appreciate help with: ${help}` : `Could use a hand with: ${help}`);
    lines.push('');
  }

  const from = o.from.trim();
  lines.push(formal ? `Thank you${from ? `,\n${from}` : '.'}` : `Thanks!${from ? ` — ${from}` : ''}`);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

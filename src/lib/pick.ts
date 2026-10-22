// Picks ONE next task for right now, and explains why in plain words.
import { daysUntil, dueLabel } from './dates';
import type { Energy, Session, Task } from './types';

const ENERGY_RANK: Record<Energy, number> = { low: 0, medium: 1, high: 2 };

export interface Pick {
  task: Task;
  score: number;
  reasons: string[];
  /** Task is bigger than the time available: suggest shrinking it. */
  tooBig: boolean;
  /** Task needs more energy than the person has right now. */
  heavy: boolean;
}

/** Tasks that can be worked on right now: open, and the first open step of any split task. */
export function actionable(tasks: Task[]): Task[] {
  const splitParents = new Set(tasks.filter((t) => t.status === 'split').map((t) => t.id));
  const firstStep = new Map<string, Task>();
  for (const t of tasks) {
    if (!t.parentId || t.status !== 'open' || !splitParents.has(t.parentId)) continue;
    const cur = firstStep.get(t.parentId);
    if (!cur || t.order < cur.order) firstStep.set(t.parentId, t);
  }
  return tasks.filter((t) => t.status === 'open' && (!t.parentId || firstStep.get(t.parentId)?.id === t.id));
}

export function scoreTask(task: Task, session: Session, all: Task[], now: Date = new Date()): Pick {
  let score = 0;
  const reasons: string[] = [];

  if (task.urgent) {
    score += 45;
    reasons.push('You marked it urgent');
  }

  const parent = task.parentId ? all.find((t) => t.id === task.parentId) : undefined;
  const due = task.due ?? parent?.due;
  if (due) {
    const d = daysUntil(due, now);
    if (d < 0) score += 60;
    else if (d === 0) score += 50;
    else if (d === 1) score += 35;
    else if (d <= 3) score += 20;
    else if (d <= 7) score += 8;
    if (d <= 3) reasons.push(dueLabel(due, now));
  }

  const tooBig = task.minutes > session.minutes;
  if (!tooBig) {
    score += 20;
    reasons.push(`Fits in your ${session.minutes} minutes`);
  } else {
    score -= Math.min(20, (task.minutes / session.minutes) * 5);
  }

  const gap = ENERGY_RANK[task.energy] - ENERGY_RANK[session.energy];
  const heavy = gap > 0;
  if (heavy) score -= 25 * gap;
  else {
    score += 15;
    if (session.energy === 'low') reasons.push('Gentle enough for low energy');
  }
  if (session.energy === 'low' && task.minutes <= 10) score += 10;
  if (session.energy === 'high' && task.energy === 'high') {
    score += 10;
    reasons.push('Good use of a high-energy moment');
  }

  if (parent) {
    score += 12;
    const doneSteps = all.filter((t) => t.parentId === parent.id && t.status === 'done').length;
    reasons.push(doneSteps > 0 ? `Keeps your momentum on “${parent.text}”` : `First tiny step of “${parent.text}”`);
  }

  score -= task.skips * 8;
  score += Math.min(7, (now.getTime() - task.createdAt) / 86_400_000);

  if (reasons.length === 0) reasons.push('A good one to get moving');
  return { task, score, reasons: reasons.slice(0, 3), tooBig, heavy };
}

export function rank(tasks: Task[], session: Session, now: Date = new Date()): Pick[] {
  return actionable(tasks)
    .map((t) => scoreTask(t, session, tasks, now))
    .sort((a, b) => b.score - a.score || a.task.createdAt - b.task.createdAt);
}

export function pickNext(tasks: Task[], session: Session, now: Date = new Date(), exclude: string[] = []): Pick | null {
  const ranked = rank(tasks, session, now).filter((p) => !exclude.includes(p.task.id));
  return ranked[0] ?? null;
}

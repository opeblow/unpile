// All app state lives here: a pure reducer + localStorage. Nothing ever leaves the device.
import { toTask, type ParsedItem } from './parse';
import { splitTask, type Step } from './shrink';
import type { AppState, Session, Settings, Task } from './types';

export const STORAGE_KEY = 'unpile:v1';

export const defaultSettings: Settings = {
  textScale: 1,
  font: 'atkinson',
  contrast: 'normal',
  reduceMotion: false,
  sound: true,
  name: '',
};

export const initialState: AppState = {
  version: 1,
  tasks: [],
  settings: defaultSettings,
  session: { energy: 'medium', minutes: 25 },
};

export type Action =
  | { type: 'add'; items: ParsedItem[] }
  | { type: 'update'; id: string; patch: Partial<Task> }
  | { type: 'remove'; id: string }
  | { type: 'done'; id: string }
  | { type: 'reopen'; id: string }
  | { type: 'park'; id: string }
  | { type: 'unpark'; id: string }
  | { type: 'skip'; id: string }
  | { type: 'split'; id: string; steps: Step[] }
  | { type: 'focus'; id: string; ms: number }
  | { type: 'session'; patch: Partial<Session> }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'clearDone' }
  | { type: 'replace'; state: AppState };

/** The task a step belongs to, or the task itself. */
function root(tasks: Task[], id: string): Task | undefined {
  const t = tasks.find((x) => x.id === id);
  if (!t) return undefined;
  return t.parentId ? tasks.find((x) => x.id === t.parentId) ?? t : t;
}

/** When every step of a split task is done, the whole task is done. */
function settleParents(tasks: Task[], now: number): Task[] {
  return tasks.map((t) => {
    if (t.status !== 'split') return t;
    const kids = tasks.filter((k) => k.parentId === t.id);
    if (kids.length > 0 && kids.every((k) => k.status === 'done')) return { ...t, status: 'done', doneAt: now };
    return t;
  });
}

function patch(tasks: Task[], id: string, p: Partial<Task>): Task[] {
  return tasks.map((t) => (t.id === id ? { ...t, ...p } : t));
}

export function reducer(state: AppState, action: Action, now: number = Date.now()): AppState {
  const { tasks } = state;
  switch (action.type) {
    case 'add':
      return { ...state, tasks: [...tasks, ...action.items.map((i) => toTask(i, now))] };
    case 'update':
      return { ...state, tasks: patch(tasks, action.id, action.patch) };
    case 'remove':
      return { ...state, tasks: tasks.filter((t) => t.id !== action.id && t.parentId !== action.id) };
    case 'done':
      return { ...state, tasks: settleParents(patch(tasks, action.id, { status: 'done', doneAt: now }), now) };
    case 'reopen': {
      const t = tasks.find((x) => x.id === action.id);
      let next = patch(tasks, action.id, { status: 'open', doneAt: undefined });
      if (t?.parentId) next = patch(next, t.parentId, { status: 'split', doneAt: undefined });
      if (tasks.some((k) => k.parentId === action.id)) next = patch(next, action.id, { status: 'split' });
      return { ...state, tasks: next };
    }
    case 'park': {
      // Parking a step parks the whole task, so the steps come back together.
      const r = root(tasks, action.id);
      return r ? { ...state, tasks: patch(tasks, r.id, { status: 'parked' }) } : state;
    }
    case 'unpark': {
      const hasKids = tasks.some((k) => k.parentId === action.id);
      return { ...state, tasks: patch(tasks, action.id, { status: hasKids ? 'split' : 'open', skips: 0 }) };
    }
    case 'skip': {
      const t = tasks.find((x) => x.id === action.id);
      return t ? { ...state, tasks: patch(tasks, t.id, { skips: t.skips + 1 }) } : state;
    }
    case 'split': {
      const t = tasks.find((x) => x.id === action.id);
      if (!t || action.steps.length === 0) return state;
      const { parent, steps } = splitTask(t, action.steps, now);
      const i = tasks.findIndex((x) => x.id === t.id);
      return { ...state, tasks: [...tasks.slice(0, i), parent, ...steps, ...tasks.slice(i + 1)] };
    }
    case 'focus': {
      const t = tasks.find((x) => x.id === action.id);
      return t ? { ...state, tasks: patch(tasks, t.id, { focusMs: t.focusMs + action.ms }) } : state;
    }
    case 'session':
      return { ...state, session: { ...state.session, ...action.patch } };
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'clearDone': {
      const doneIds = new Set(tasks.filter((t) => t.status === 'done' && !t.parentId).map((t) => t.id));
      return { ...state, tasks: tasks.filter((t) => !doneIds.has(t.id) && !(t.parentId && doneIds.has(t.parentId))) };
    }
    case 'replace':
      return action.state;
  }
}

export function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return sanitize(JSON.parse(raw));
  } catch {
    return initialState;
  }
}

export function save(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode or storage full: the app still works for this visit */
  }
}

/** Accepts saved or imported data and fills any gaps, so old or hand-edited files can't crash the app. */
export function sanitize(data: unknown): AppState {
  const d = (data ?? {}) as Partial<AppState>;
  const tasks = Array.isArray(d.tasks)
    ? d.tasks
        .filter((t): t is Task => !!t && typeof t.id === 'string' && typeof t.text === 'string')
        .map((t) => ({
          ...t,
          raw: t.raw ?? t.text,
          minutes: Number.isFinite(t.minutes) ? t.minutes : 25,
          energy: t.energy ?? 'medium',
          tags: Array.isArray(t.tags) ? t.tags : [],
          status: t.status ?? 'open',
          order: t.order ?? 0,
          createdAt: t.createdAt ?? Date.now(),
          skips: t.skips ?? 0,
          focusMs: t.focusMs ?? 0,
        }))
    : [];
  return {
    version: 1,
    tasks,
    settings: { ...defaultSettings, ...(d.settings ?? {}) },
    session: { ...initialState.session, ...(d.session ?? {}) },
  };
}

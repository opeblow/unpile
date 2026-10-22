export type Energy = 'low' | 'medium' | 'high';
export type Status = 'open' | 'done' | 'parked' | 'split';

export interface Task {
  id: string;
  /** Clean, human title ("Write history essay"). */
  text: string;
  /** What the person originally typed. */
  raw: string;
  /** Local date, yyyy-mm-dd. */
  due?: string;
  urgent?: boolean;
  /** Best-guess effort in minutes. */
  minutes: number;
  energy: Energy;
  tags: string[];
  status: Status;
  /** Set when this task is a step created by shrinking a bigger one. */
  parentId?: string;
  /** Order among siblings (steps). */
  order: number;
  createdAt: number;
  doneAt?: number;
  /** Times the person said "not this one". Used so the picker doesn't nag. */
  skips: number;
  /** Total focused time spent, in ms. */
  focusMs: number;
}

export interface Settings {
  textScale: 1 | 1.15 | 1.3;
  font: 'atkinson' | 'lexend';
  contrast: 'normal' | 'high';
  reduceMotion: boolean;
  sound: boolean;
  name: string;
}

export interface Session {
  energy: Energy;
  minutes: number;
}

export interface AppState {
  version: 1;
  tasks: Task[];
  settings: Settings;
  session: Session;
}

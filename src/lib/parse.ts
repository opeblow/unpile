// Turns a messy brain dump into clean tasks. Runs fully on-device: no AI service, no network.
import { addDays, toISO } from './dates';
import type { Energy, Task } from './types';

export interface ParsedItem {
  text: string;
  raw: string;
  due?: string;
  urgent: boolean;
  minutes: number;
  /** True when the person gave a time ("30m") instead of us guessing. */
  minutesGiven: boolean;
  energy: Energy;
  tags: string[];
}

// ---------- splitting ----------

const BULLET = /^\s*(?:[-*•–—>+]|\d{1,2}[.)]|[a-z][.)](?=\s))\s*/i;
const CHECKBOX = /^\s*\[( |x|X)?\]\s*/;

/** Split a dump into one string per task. Handles lines, bullets, ";", sentences and short comma lists. */
export function splitDump(input: string): string[] {
  const out: string[] = [];
  const lines = input.replace(/\r/g, '').split(/\n|;|\s+•\s+/);
  for (let line of lines) {
    // Ticked checkboxes are already done.
    if (/^\s*(?:[-*•]\s*)?\[[xX]\]/.test(line)) continue;
    line = line.replace(BULLET, '').replace(CHECKBOX, '').trim();
    if (!line) continue;

    const parts = line.split(
      /(?<=[.!?])\s+(?=[A-Za-z])|,\s*(?:also|and then|then|plus)\s+|\s+(?:and also|also|and then)\s+/i
    );
    for (const p of parts) {
      const commaBits = p.split(/\s*,\s*/).filter(Boolean);
      const isShortList = commaBits.length >= 3 && commaBits.every((b) => b.split(/\s+/).length <= 5);
      if (isShortList) {
        for (const b of commaBits) out.push(b.replace(/^(?:and|or)\s+/i, ''));
      } else {
        out.push(p);
      }
    }
  }
  return out
    .map((s) => s.trim())
    .filter((s) => s.replace(/[^\p{L}\p{N}]/gu, '').length > 1)
    .filter((s) => !isNoise(s));
}

// Feelings and filler aren't tasks: "ugh ok", "so much to do", "idk".
const NOISE = new Set(
  "ugh ok okay hmm hm idk so much to do lol omg argh help aaah aah wow um umm uh well right anyway things stuff list my i'm im the and a of".split(' ')
);
function isNoise(s: string): boolean {
  const words = s.toLowerCase().split(/[^a-z']+/).filter(Boolean);
  return words.length > 0 && words.every((w) => NOISE.has(w));
}

// ---------- dates ----------

const PREP = String.raw`(?:\b(?:by|before|on|due|for|until|till|this|next|due on|due by)\s+)?`;
const FULL_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SHORT_DAYS: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6,
};
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const WORD_NUM: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5 };

function nextWeekday(now: Date, target: number, forceNext: boolean): Date {
  let diff = (target - now.getDay() + 7) % 7;
  if (diff === 0 && forceNext) diff = 7;
  return addDays(now, diff);
}

interface DateHit {
  due?: string;
  text: string;
}

export function extractDate(text: string, now: Date = new Date()): DateHit {
  const rules: Array<[RegExp, (m: RegExpMatchArray) => Date | null]> = [
    [new RegExp(String.raw`\b(\d{4})-(\d{2})-(\d{2})\b`, 'i'), (m) => new Date(+m[1], +m[2] - 1, +m[3])],
    [new RegExp(PREP + String.raw`\bday after tomorrow\b`, 'i'), () => addDays(now, 2)],
    [new RegExp(PREP + String.raw`\b(?:today|tonight|this (?:morning|afternoon|evening)|eod)\b`, 'i'), () => now],
    [new RegExp(PREP + String.raw`\b(?:tomorrow|tmrw|tmrrw|tmr|tomoz|2moro)\b`, 'i'), () => addDays(now, 1)],
    [
      new RegExp(PREP + String.raw`\bin (\d+|a|an|one|two|three|four|five) (days?|weeks?)\b`, 'i'),
      (m) => {
        const n = WORD_NUM[m[1].toLowerCase()] ?? parseInt(m[1], 10);
        return addDays(now, /week/i.test(m[2]) ? n * 7 : n);
      },
    ],
    [new RegExp(PREP + String.raw`\bnext week\b`, 'i'), () => addDays(now, 7)],
    [new RegExp(PREP + String.raw`\b(?:end of (?:the )?week|eow)\b`, 'i'), () => nextWeekday(now, 5, false)],
    [new RegExp(PREP + String.raw`\b(?:the )?weekend\b`, 'i'), () => nextWeekday(now, 6, false)],
    [
      new RegExp(String.raw`(?:\b(?:by|before|on|due|until|till)\s+)?\b(next\s+)?(${FULL_DAYS.join('|')})\b`, 'i'),
      (m) => nextWeekday(now, FULL_DAYS.indexOf(m[2].toLowerCase()), !!m[1]),
    ],
    [
      // Short day names only count with a preposition ("by fri"), so "sat exam" isn't a date.
      new RegExp(String.raw`\b(?:by|before|on|due|until|till|this|next)\s+(${Object.keys(SHORT_DAYS).join('|')})\b\.?`, 'i'),
      (m) => nextWeekday(now, SHORT_DAYS[m[1].toLowerCase()], /next/i.test(m[0])),
    ],
    [
      new RegExp(PREP + String.raw`\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(${MONTHS.join('|')})[a-z]*\.?`, 'i'),
      (m) => monthDate(now, MONTHS.indexOf(m[2].toLowerCase().slice(0, 3)), +m[1]),
    ],
    [
      new RegExp(PREP + String.raw`\b(${MONTHS.join('|')})[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b`, 'i'),
      (m) => monthDate(now, MONTHS.indexOf(m[1].toLowerCase().slice(0, 3)), +m[2]),
    ],
  ];

  for (const [re, toDate] of rules) {
    const m = text.match(re);
    if (!m) continue;
    const d = toDate(m);
    if (!d || isNaN(d.getTime())) continue;
    return { due: toISO(d), text: text.replace(m[0], ' ') };
  }
  return { text };
}

function monthDate(now: Date, month: number, day: number): Date | null {
  if (month < 0 || day < 1 || day > 31) return null;
  let d = new Date(now.getFullYear(), month, day);
  // "3 Jan" typed in November means next January.
  if (now.getTime() - d.getTime() > 60 * 86_400_000) d = new Date(now.getFullYear() + 1, month, day);
  return d;
}

// ---------- effort & energy ----------

type Effort = [minutes: number, energy: Energy];

const VERBS: Record<string, Effort> = {};
function verbs(list: string, effort: Effort) {
  for (const v of list.split(' ')) VERBS[v] = effort;
}
verbs('reply text email e-mail message dm rsvp pay book buy order print sign submit upload send renew cancel confirm check water charge download forward share post ask remind return pick drop take top', [10, 'low']);
verbs('call phone ring', [10, 'medium']);
verbs('tidy clean wash laundry dishes iron fold sort file backup shop groceries walk stretch', [20, 'low']);
verbs('read review fill organize organise plan schedule prepare prep practice practise edit proofread cook exercise gym run meet update watch', [30, 'medium']);
verbs('write draft study revise research debug code build design learn fix implement finish start outline memorize memorise solve analyse analyze apply', [45, 'high']);

const BIG_NOUNS = /\b(essay|thesis|dissertation|project|assignment|presentation|portfolio|report|coursework|exam|application|proposal|lab ?report|chapter|slides|deck)\b/i;

export function estimate(text: string): Effort {
  const lower = text.toLowerCase();
  const verb = lower.match(/^[a-z-]+/)?.[0] ?? '';
  let [minutes, energy]: Effort = VERBS[verb] ?? [25, 'medium'];
  const known = verb in VERBS;
  const lightVerb = known && minutes <= 10;

  if (BIG_NOUNS.test(lower) && !lightVerb) {
    minutes = Math.max(minutes, 90);
    energy = 'high';
  }
  if (!known) {
    // Fall back to any verb that appears later ("history essay - write it")
    for (const w of lower.split(/[^a-z-]+/)) {
      if (VERBS[w]) {
        [minutes, energy] = VERBS[w];
        if (BIG_NOUNS.test(lower)) [minutes, energy] = [90, 'high'];
        break;
      }
    }
  }
  if (/\b(quick|quickly|just|tiny|small)\b/.test(lower)) minutes = Math.min(minutes, 10);
  return [minutes, energy];
}

// ---------- one item ----------

const FILLER =
  /^(?:(?:i\s+)?(?:really\s+)?(?:need|have|got|gotta|must|should|want|ought)\s+(?:to\s+)?|gotta\s+|remember\s+to\s+|don'?t\s+forget\s+(?:to\s+)?|to\s?-?do:?\s+|also\s+|and\s+|then\s+|pls\s+|please\s+|plus\s+|oh\s+and\s+)/i;

export function parseItem(raw: string, now: Date = new Date()): ParsedItem {
  let text = raw.trim();

  const tags: string[] = [];
  text = text.replace(/(^|\s)#([\p{L}\p{N}_-]+)/gu, (_, sp, t) => {
    tags.push(t.toLowerCase());
    return sp;
  });

  let urgent = false;
  text = text.replace(/\b(?:asap|urgent(?:ly)?|right away|immediately)\b|!{2,}/gi, () => {
    urgent = true;
    return ' ';
  });

  let minutes: number | undefined;
  text = text.replace(
    /\(?\s*(?:~|about|around|for)?\s*(\d+(?:\.\d+)?)\s*(m|mins?|minutes?|h|hrs?|hours?)\b\s*\)?/i,
    (_, n, unit) => {
      minutes = Math.round(parseFloat(n) * (/^h/i.test(unit) ? 60 : 1));
      return ' ';
    }
  );
  text = text.replace(/\b(?:for\s+)?(half an hour|an hour)\b/i, (_, p) => {
    minutes = /half/i.test(p) ? 30 : 60;
    return ' ';
  });

  const dated = extractDate(text, now);
  text = dated.text;

  for (let i = 0; i < 3; i++) text = text.trim().replace(FILLER, '');
  text = text
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/\b(?:by|before|on|due|until|till)\s*$/i, '')
    .replace(/^[\s,.:;–—-]+|[\s,.:;–—-]+$/g, '')
    .trim();
  if (!text) text = raw.trim();
  text = text[0].toUpperCase() + text.slice(1);

  const [guessMin, energy] = estimate(text);
  return {
    text,
    raw: raw.trim(),
    due: dated.due,
    urgent,
    minutes: minutes ?? guessMin,
    minutesGiven: minutes !== undefined,
    energy,
    tags,
  };
}

export function parseDump(input: string, now: Date = new Date()): ParsedItem[] {
  const seen = new Set<string>();
  const items: ParsedItem[] = [];
  for (const piece of splitDump(input)) {
    const item = parseItem(piece, now);
    const key = item.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
  }
  return items;
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function toTask(item: ParsedItem, now: number = Date.now()): Task {
  return {
    id: uid(),
    text: item.text,
    raw: item.raw,
    due: item.due,
    urgent: item.urgent || undefined,
    minutes: item.minutes,
    energy: item.energy,
    tags: item.tags,
    status: 'open',
    order: 0,
    createdAt: now,
    skips: 0,
    focusMs: 0,
  };
}

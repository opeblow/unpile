// "Too big?" — breaks a scary task into small, concrete, physical steps.
// Rule-based on purpose: instant, private, works offline, and every step is predictable.
import { uid } from './parse';
import type { Energy, Task } from './types';

export interface Step {
  text: string;
  minutes: number;
  energy: Energy;
}

interface Recipe {
  match: RegExp;
  steps: Array<[string, number, Energy]>;
}

// {t} = the task's subject, e.g. "history essay".
const RECIPES: Recipe[] = [
  {
    match: /\b(presentation|slides|deck|pitch|talk)\b/i,
    steps: [
      ['Open your slides app and make just the title slide for {t}', 5, 'low'],
      ['Write the 3 things you want people to remember', 10, 'medium'],
      ['Make one slide per point — headings only', 15, 'medium'],
      ['Fill in each slide with a few words, not paragraphs', 30, 'high'],
      ['Say it out loud once with a timer running', 15, 'medium'],
    ],
  },
  {
    match: /\b(apply|application|cv|resume|résumé|cover letter|scholarship|form|internship)\b/i,
    steps: [
      ['Open the page for {t} and bookmark it', 3, 'low'],
      ['List everything it asks for (documents, questions)', 10, 'low'],
      ['Gather one document from that list', 10, 'low'],
      ['Fill in only the easy fields', 15, 'medium'],
      ['Do the hardest question, then submit', 30, 'high'],
    ],
  },
  {
    match: /\b(essay|paper|thesis|dissertation|report|article|blog|write|draft|coursework|assignment|proposal)\b/i,
    steps: [
      ['Open a blank doc and name it “{t}”', 3, 'low'],
      ['Dump 5 messy bullet points — no full sentences yet', 10, 'medium'],
      ['Turn one bullet into a rough paragraph', 15, 'medium'],
      ['Write the rest badly. Fixing comes later.', 40, 'high'],
      ['Read it once and fix the worst bit', 15, 'medium'],
    ],
  },
  {
    match: /\b(study|revise|revision|exam|test|quiz|learn|memori[sz]e|flashcards?)\b/i,
    steps: [
      ['Put your notes for {t} in front of you', 3, 'low'],
      ['Skim only the headings for 5 minutes', 5, 'low'],
      ['Pick one topic and write 3 questions about it', 10, 'medium'],
      ['Answer them without looking, then check', 20, 'high'],
      ['Circle what you got wrong — that’s where you start next time', 5, 'low'],
    ],
  },
  {
    match: /\b(code|bug|debug|fix|build|implement|deploy|app|website|feature|program|script)\b/i,
    steps: [
      ['Open the project and run it once', 5, 'low'],
      ['Write one line: what does “done” look like?', 5, 'medium'],
      ['Find the file where it starts', 10, 'medium'],
      ['Make the smallest change that moves it forward', 25, 'high'],
      ['Run it again and save / commit', 5, 'low'],
    ],
  },
  {
    match: /\b(research|investigate|look into|find out)\b/i,
    steps: [
      ['Write the one question you’re trying to answer', 3, 'low'],
      ['Search and open 3 sources', 10, 'medium'],
      ['Copy one useful line from each', 15, 'medium'],
      ['Write 3 sentences on what you found', 10, 'medium'],
    ],
  },
  {
    match: /\b(read|chapter|book|reading)\b/i,
    steps: [
      ['Open {t} to the first page', 2, 'low'],
      ['Read for 10 minutes — just 10', 10, 'medium'],
      ['Write one sentence: what was it about?', 3, 'low'],
      ['Keep going or stop. Both count.', 20, 'medium'],
    ],
  },
  {
    match: /\b(email|e-mail|reply|message|text|dm|respond|write back)\b/i,
    steps: [
      ['Open the conversation', 1, 'low'],
      ['Write only the first sentence', 3, 'low'],
      ['Finish it in plain words — short is fine', 5, 'low'],
      ['Press send', 1, 'low'],
    ],
  },
  {
    match: /\b(call|phone|ring)\b/i,
    steps: [
      ['Find the number and put it on screen', 2, 'low'],
      ['Write the one sentence you’ll open with', 3, 'low'],
      ['Call. No answer? Leave a one-line message.', 5, 'medium'],
    ],
  },
  {
    match: /\b(pay|bill|fees?|rent|invoice|tax|taxes)\b/i,
    steps: [
      ['Open the app or site you pay {t} with', 2, 'low'],
      ['Find the amount and reference number', 5, 'low'],
      ['Pay it and screenshot the receipt', 5, 'low'],
    ],
  },
  {
    match: /\b(clean|tidy|organi[sz]e|declutter|room|kitchen|laundry|dishes|wash)\b/i,
    steps: [
      ['Set a 5-minute timer and clear one surface', 5, 'low'],
      ['Put away anything that already has a home', 10, 'low'],
      ['Bag up the rubbish', 5, 'low'],
      ['One more spot if you still have energy', 10, 'low'],
    ],
  },
  {
    match: /\b(buy|shop|shopping|groceries|order)\b/i,
    steps: [
      ['Write the list — 3 items is fine', 3, 'low'],
      ['Open the shop app or grab a bag', 2, 'low'],
      ['Get just what’s on the list', 20, 'low'],
    ],
  },
  {
    match: /\b(book|schedule|appointment|meeting|plan|arrange)\b/i,
    steps: [
      ['Open your calendar', 1, 'low'],
      ['Pick two times that could work', 3, 'low'],
      ['Send the request or book it', 5, 'low'],
    ],
  },
];

const GENERIC: Array<[string, number, Energy]> = [
  ['Get out what you need for “{t}”', 3, 'low'],
  ['Do the first 5 minutes only', 5, 'low'],
  ['Decide the next tiny bit and write it down', 3, 'low'],
  ['Keep going for 15 more minutes', 15, 'medium'],
];

const LEAD_VERB =
  /^(write|draft|finish|start|do|make|study|revise|for|prepare|prep|work on|complete|fix|build|read|reply to|email|message|text|call|phone|pay|clean|tidy|buy|book|research|apply for|apply to|submit|plan)\s+(?:the\s+|my\s+|a\s+|an\s+)?/i;

/** "Write my history essay" -> "history essay". */
export function subject(text: string): string {
  const s = text.replace(LEAD_VERB, '').trim();
  return s.length > 1 ? s : text;
}

export function suggestSteps(text: string): Step[] {
  // The leading verb wins ("Email tutor about essay" is an email, not an essay).
  const head = text.split(/\s+/).slice(0, 2).join(' ');
  const recipe = RECIPES.find((r) => r.match.test(head)) ?? RECIPES.find((r) => r.match.test(text));
  const t = subject(text);
  return (recipe?.steps ?? GENERIC).map(([s, minutes, energy]) => ({
    text: s.replace('{t}', t),
    minutes,
    energy,
  }));
}

/** Split a task: the parent becomes a container, steps become real tasks in order. */
export function splitTask(parent: Task, steps: Step[], now: number = Date.now()): { parent: Task; steps: Task[] } {
  return {
    parent: { ...parent, status: 'split' },
    steps: steps.map((s, i) => ({
      id: uid(),
      text: s.text,
      raw: s.text,
      due: parent.due,
      urgent: parent.urgent,
      minutes: s.minutes,
      energy: s.energy,
      tags: parent.tags,
      status: 'open',
      parentId: parent.id,
      order: i,
      createdAt: now,
      skips: 0,
      focusMs: 0,
    })),
  };
}

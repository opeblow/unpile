import { describe, expect, it } from 'vitest';
import { parseDump, parseItem, splitDump, extractDate } from './parse';
import { pickNext, actionable } from './pick';
import { suggestSteps, subject } from './shrink';
import { reducer, initialState, sanitize } from './store';
import { buildUpdate } from './share';
import { SAMPLE_DUMP } from './sample';

// Thursday 22 Oct 2026, 10:00 local
const NOW = new Date(2026, 9, 22, 10, 0);

describe('splitDump', () => {
  it('splits lines, bullets, semicolons and short comma lists', () => {
    expect(splitDump('- a thing\n* b thing; c thing\nlaundry, dishes, bins')).toEqual([
      'a thing', 'b thing', 'c thing', 'laundry', 'dishes', 'bins',
    ]);
  });
  it('drops feelings and filler', () => {
    expect(splitDump('ugh ok. so much to do\nidk\ncall mum')).toEqual(['call mum']);
  });
  it('skips ticked checkboxes', () => {
    expect(splitDump('[x] done thing\n[ ] open thing')).toEqual(['open thing']);
  });
  it('splits sentences in a paragraph', () => {
    expect(splitDump('Email the tutor. Then buy milk also call dad')).toEqual(['Email the tutor.', 'Then buy milk', 'call dad']);
  });
});

describe('dates', () => {
  it('reads relative words', () => {
    expect(extractDate('do it tomorrow', NOW).due).toBe('2026-10-23');
    expect(extractDate('do it today', NOW).due).toBe('2026-10-22');
    expect(extractDate('essay due friday', NOW).due).toBe('2026-10-23');
    expect(extractDate('by next thursday', NOW).due).toBe('2026-10-29');
    expect(extractDate('in 3 days', NOW).due).toBe('2026-10-25');
    expect(extractDate('next week', NOW).due).toBe('2026-10-29');
    expect(extractDate('by fri', NOW).due).toBe('2026-10-23');
  });
  it('reads month dates and rolls into next year', () => {
    expect(extractDate('due 24th oct', NOW).due).toBe('2026-10-24');
    expect(extractDate('Nov 3', NOW).due).toBe('2026-11-03');
    expect(extractDate('on 5 jan', NOW).due).toBe('2027-01-05');
  });
  it('ignores short day names without a preposition', () => {
    expect(extractDate('sat exam prep', NOW).due).toBeUndefined();
  });
});

describe('parseItem', () => {
  it('cleans filler, dates, urgency and tags', () => {
    const p = parseItem('I need to finish history essay by friday!! #school', NOW);
    expect(p.text).toBe('Finish history essay');
    expect(p.due).toBe('2026-10-23');
    expect(p.urgent).toBe(true);
    expect(p.tags).toEqual(['school']);
    expect(p.energy).toBe('high');
    expect(p.minutes).toBeGreaterThanOrEqual(90);
  });
  it('respects a stated duration', () => {
    const p = parseItem('read chapter 4 (40 min)', NOW);
    expect(p.minutes).toBe(40);
    expect(p.minutesGiven).toBe(true);
    expect(p.text).toBe('Read chapter 4');
  });
  it('keeps a light verb light even with a big noun', () => {
    const p = parseItem('email tutor about the essay', NOW);
    expect(p.minutes).toBe(10);
    expect(p.energy).toBe('low');
  });
  it('parses the sample pile sensibly', () => {
    const items = parseDump(SAMPLE_DUMP, NOW);
    expect(items.map((i) => i.text)).toEqual([
      'History essay',
      'Reply to Tola about the group project',
      'Study for stats quiz',
      'Pay school fees',
      'Laundry',
      'Dishes',
      'Take out the bin',
      'Read chapter 4 for bio',
      'Call mum',
      'Fix the login bug on the club website',
      'Apply for the summer internship',
      'Book dentist appointment',
    ]);
  });
});

describe('picker', () => {
  const load = (energy: 'low' | 'medium' | 'high', minutes: number) => {
    let s = reducer(initialState, { type: 'add', items: parseDump(SAMPLE_DUMP, NOW) }, NOW.getTime());
    s = reducer(s, { type: 'session', patch: { energy, minutes } });
    return s;
  };
  it('low energy + 10 min picks something urgent and small', () => {
    const s = load('low', 10);
    const p = pickNext(s.tasks, s.session, NOW)!;
    expect(p.task.text).toBe('Pay school fees');
    expect(p.reasons.join(' ')).toMatch(/urgent/i);
  });
  it('high energy + long time goes for the big deadline', () => {
    const s = load('high', 120);
    const p = pickNext(s.tasks, s.session, NOW)!;
    expect(p.task.text).toBe('History essay');
  });
  it('excluding moves on to a different task', () => {
    const s = load('low', 10);
    const first = pickNext(s.tasks, s.session, NOW)!;
    const second = pickNext(s.tasks, s.session, NOW, [first.task.id])!;
    expect(second.task.id).not.toBe(first.task.id);
  });
});

describe('shrink + steps', () => {
  it('finds the subject', () => {
    expect(subject('Write my history essay')).toBe('history essay');
  });
  it('the leading verb wins', () => {
    expect(suggestSteps('Email tutor about essay')[0].text).toBe('Open the conversation');
    expect(suggestSteps('Write history essay')[0].text).toBe('Open a blank doc and name it “history essay”');
  });
  it('first step is always tiny', () => {
    for (const t of ['Study for stats quiz', 'Fix the login bug', 'Do the thing', 'Apply for internship', 'Make slides for pitch']) {
      expect(suggestSteps(t)[0].minutes).toBeLessThanOrEqual(5);
    }
  });
  it('split: only the first step is actionable; finishing all steps finishes the task', () => {
    let s = reducer(initialState, { type: 'add', items: [parseItem('Write history essay', NOW)] });
    const id = s.tasks[0].id;
    s = reducer(s, { type: 'split', id, steps: suggestSteps('Write history essay') });
    expect(s.tasks.find((t) => t.id === id)!.status).toBe('split');
    const act = actionable(s.tasks);
    expect(act).toHaveLength(1);
    expect(act[0].order).toBe(0);
    for (const step of s.tasks.filter((t) => t.parentId === id)) s = reducer(s, { type: 'done', id: step.id });
    expect(s.tasks.find((t) => t.id === id)!.status).toBe('done');
  });
  it('parking a step parks the whole task', () => {
    let s = reducer(initialState, { type: 'add', items: [parseItem('Write history essay', NOW)] });
    const id = s.tasks[0].id;
    s = reducer(s, { type: 'split', id, steps: suggestSteps('Write history essay') });
    const step = actionable(s.tasks)[0];
    s = reducer(s, { type: 'park', id: step.id });
    expect(actionable(s.tasks)).toHaveLength(0);
    s = reducer(s, { type: 'unpark', id });
    expect(actionable(s.tasks)).toHaveLength(1);
  });
});

describe('share + storage', () => {
  it('writes a readable update', () => {
    let s = reducer(initialState, { type: 'add', items: parseDump('pay fees\ncall mum\nwrite essay', NOW) }, NOW.getTime());
    s = reducer(s, { type: 'done', id: s.tasks[0].id }, NOW.getTime());
    const msg = buildUpdate({ tasks: s.tasks, session: s.session, tone: 'friendly', window: 'today', to: 'Ada', from: 'Sam', help: '', now: NOW });
    expect(msg).toContain('Hi Ada!');
    expect(msg).toContain('• Pay fees');
    expect(msg).toContain('Up next');
  });
  it('sanitize survives junk', () => {
    expect(sanitize(null).tasks).toEqual([]);
    expect(sanitize({ tasks: [{ id: 'x', text: 'hi' }, { nope: 1 }] }).tasks).toHaveLength(1);
  });
});

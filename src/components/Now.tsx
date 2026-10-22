import { useEffect, useMemo, useState } from 'react';
import { pickNext, actionable } from '../lib/pick';
import type { Energy, Session, Task } from '../lib/types';
import { Bars, ENERGY_LABEL, PileMark, Segmented, minutesLabel } from './ui';

const TIME_OPTIONS = [5, 15, 25, 45, 90];

interface Props {
  tasks: Task[];
  session: Session;
  /** Keyboard shortcuts only fire when nothing else (dialog, focus mode) is open. */
  shortcuts: boolean;
  onSession: (p: Partial<Session>) => void;
  onStart: (task: Task, minutes: number) => void;
  onDone: (task: Task) => void;
  onShrink: (task: Task) => void;
  onSkip: (task: Task) => void;
  onPark: (task: Task) => void;
  go: (tab: 'dump' | 'pile' | 'done') => void;
}

function isTyping(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
}

export function Now({ tasks, session, shortcuts, onSession, onStart, onDone, onShrink, onSkip, onPark, go }: Props) {
  // Tasks passed over in this sitting, so "show me another" walks through options instead of bouncing back.
  const [passed, setPassed] = useState<string[]>([]);
  const open = useMemo(() => actionable(tasks), [tasks]);

  const pick = useMemo(() => {
    const p = pickNext(tasks, session, new Date(), passed);
    return p ?? (passed.length ? pickNext(tasks, session, new Date()) : null);
  }, [tasks, session, passed]);

  const task = pick?.task;
  const parent = task?.parentId ? tasks.find((t) => t.id === task.parentId) : undefined;
  const siblings = parent ? tasks.filter((t) => t.parentId === parent.id).sort((a, b) => a.order - b.order) : [];
  const startMinutes = task ? Math.max(1, Math.min(task.minutes, session.minutes)) : 0;

  function another() {
    if (!task) return;
    onSkip(task);
    setPassed((p) => {
      const next = [...p, task.id];
      // Seen everything? Start the loop again.
      return next.length >= open.length ? [] : next;
    });
  }

  useEffect(() => {
    if (!shortcuts || !task) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const k = e.key.toLowerCase();
      if (k === 'enter' && (e.target as HTMLElement)?.tagName !== 'BUTTON') onStart(task, startMinutes);
      else if (k === 'd') onDone(task);
      else if (k === 's') onShrink(task);
      else if (k === 'n') another();
      else if (k === 'p') onPark(task);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const hasAny = tasks.some((t) => !t.parentId);
  const doneCount = tasks.filter((t) => t.status === 'done' && !t.parentId).length;
  const parkedCount = tasks.filter((t) => t.status === 'parked').length;

  return (
    <section aria-labelledby="now-title" className="fade-in">
      <div className="page-head">
        <p className="eyebrow">Step 2 · Just one thing</p>
        <h1 id="now-title">What fits right now?</h1>
      </div>

      <div className="checkin">
        <Segmented<Energy>
          legend="How’s your energy?"
          name="energy"
          value={session.energy}
          onChange={(energy) => onSession({ energy })}
          options={(['low', 'medium', 'high'] as Energy[]).map((e, i) => ({
            value: e,
            label: (
              <>
                <Bars level={i + 1} /> {ENERGY_LABEL[e]}
              </>
            ),
          }))}
        />
        <Segmented<number>
          legend="How long have you got?"
          name="minutes"
          value={session.minutes}
          onChange={(minutes) => onSession({ minutes })}
          options={TIME_OPTIONS.map((m) => ({
            value: m,
            label: m === 90 ? '90+ min' : `${m} min`,
            aria: m === 90 ? '90 minutes or more' : `${m} minutes`,
          }))}
        />
      </div>

      {!task && !hasAny && (
        <div className="empty">
          <h2>Nothing in the pile yet</h2>
          <p>Start by emptying your head. Everything you’re carrying, in any order.</p>
          <button className="btn btn-primary btn-lg" onClick={() => go('dump')}>
            Empty my head
          </button>
        </div>
      )}

      {!task && hasAny && (
        <div className="empty">
          <h2>{parkedCount ? 'Everything left is parked' : 'Pile cleared.'}</h2>
          <p>
            {parkedCount
              ? `You parked ${parkedCount} ${parkedCount === 1 ? 'thing' : 'things'} for later. Bring one back when you’re ready.`
              : `You finished ${doneCount} ${doneCount === 1 ? 'thing' : 'things'}. That’s the whole list. Go do something nice.`}
          </p>
          <div className="one-actions" style={{ justifyContent: 'center' }}>
            {parkedCount > 0 && (
              <button className="btn" onClick={() => go('pile')}>
                See parked things
              </button>
            )}
            <button className="btn" onClick={() => go('done')}>
              See what I finished
            </button>
            <button className="btn btn-primary" onClick={() => go('dump')}>
              Add more
            </button>
          </div>
        </div>
      )}

      {task && pick && (
        <article className="one fade-in" key={task.id} aria-labelledby="one-title" aria-live="polite">
          <div className="one-meta">
            <p className="eyebrow" style={{ margin: 0 }}>
              Your one thing
            </p>
            {parent && (
              <span className="parent-line">
                Step {task.order + 1} of {siblings.length}
                <span className="progress-dots" aria-hidden="true">
                  {siblings.map((s) => (
                    <i key={s.id} className={s.status === 'done' ? 'done' : s.id === task.id ? 'now' : ''} />
                  ))}
                </span>
              </span>
            )}
          </div>
          {parent && <p className="parent-line" style={{ margin: '0 0 6px' }}>Part of “{parent.text}”</p>}
          <h2 id="one-title" className="one-title">
            {task.text}
          </h2>

          <ul className="chips" aria-label="Why this one">
            {pick.reasons.map((r) => (
              <li key={r} className={`chip ${/due|urgent|overdue/i.test(r) ? 'chip-due' : 'chip-good'}`}>
                {r}
              </li>
            ))}
            <li className="chip">{minutesLabel(task.minutes)}</li>
          </ul>

          {pick.tooBig && !parent && (
            <div className="nudge" role="note">
              <p>
                This is bigger than your {session.minutes} minutes.{' '}
                <button className="link-btn" onClick={() => onShrink(task)}>
                  Break it into tiny steps
                </button>{' '}
                — or just start. {session.minutes} minutes still counts.
              </p>
            </div>
          )}
          {pick.heavy && !pick.tooBig && (
            <div className="nudge" role="note">
              <p>This one needs more focus than you have right now. Starting is the hardest part — or pick another.</p>
            </div>
          )}

          <div className="one-actions">
            <button className="btn btn-primary btn-lg" onClick={() => onStart(task, startMinutes)}>
              Start · {startMinutes} min
              <span className="kbd" aria-hidden="true">
                ↵
              </span>
            </button>
            <button className="btn btn-lg" onClick={() => onDone(task)}>
              Already done
              <span className="kbd" aria-hidden="true">
                D
              </span>
            </button>
          </div>

          <div className="stuck">
            <span>Not feeling it?</span>
            {!parent && (
              <button className="btn btn-quiet" onClick={() => onShrink(task)}>
                Too big — shrink it <span className="kbd" aria-hidden="true">S</span>
              </button>
            )}
            {open.length > 1 && (
              <button className="btn btn-quiet" onClick={another}>
                Show me another <span className="kbd" aria-hidden="true">N</span>
              </button>
            )}
            <button className="btn btn-quiet" onClick={() => onPark(task)}>
              Park it for later <span className="kbd" aria-hidden="true">P</span>
            </button>
          </div>

          <details className="why">
            <summary>Why this one?</summary>
            <p>
              Unpile looked at {open.length} open {open.length === 1 ? 'thing' : 'things'} and weighed deadlines, how long each takes, and how much
              focus it needs against how you feel right now. {pick.reasons.join('. ')}. Skipped tasks drop down so you’re not nagged.
            </p>
          </details>
        </article>
      )}

      {task && open.length > 1 && (
        <div className="quiet-pile">
          <PileMark size={40} />
          <p>
            {open.length - 1} other {open.length - 1 === 1 ? 'thing is' : 'things are'} waiting quietly. You don’t have to look at them right now.{' '}
            <button className="link-btn" onClick={() => go('pile')}>
              Peek at the pile
            </button>
          </p>
        </div>
      )}
    </section>
  );
}

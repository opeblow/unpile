import type React from 'react';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { reducer, load, save, type Action } from './lib/store';
import { actionable } from './lib/pick';
import type { AppState, Task } from './lib/types';
import { Dump } from './components/Dump';
import { Now } from './components/Now';
import { Focus } from './components/Focus';
import { ShrinkDialog } from './components/ShrinkDialog';
import { Pile } from './components/Pile';
import { Done } from './components/Done';
import { Share } from './components/Share';
import { SettingsDialog } from './components/SettingsDialog';
import { PileMark } from './components/ui';
import { Landing } from './components/Landing';
import { SAMPLE_DUMP } from './lib/sample';

type Tab = 'home' | 'now' | 'dump' | 'pile' | 'done' | 'share';
const TABS: Tab[] = ['now', 'dump', 'pile', 'done', 'share'];

function readHash(): Tab | null {
  const h = location.hash.replace('#', '') as Tab;
  return TABS.includes(h) || h === 'home' ? h : null;
}

interface Toast {
  msg: string;
  undo?: AppState;
  id: number;
}

export default function App() {
  const [state, rawDispatch] = useReducer((s: AppState, a: Action) => reducer(s, a), undefined, load);
  const [tab, setTab] = useState<Tab>(() => readHash() ?? (state.tasks.some((t) => t.status !== 'done') ? 'now' : state.tasks.length ? 'dump' : 'home'));
  const [focus, setFocus] = useState<{ id: string; minutes: number } | null>(null);
  const [shrinking, setShrinking] = useState<Task | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const mainRef = useRef<HTMLElement>(null);

  const dispatch = rawDispatch;

  useEffect(() => save(state), [state]);

  // Comfort settings live on <html> so CSS can react to them.
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--scale', String(state.settings.textScale));
    r.dataset.font = state.settings.font;
    r.dataset.contrast = state.settings.contrast;
    r.dataset.motion = state.settings.reduceMotion ? 'reduce' : 'normal';
  }, [state.settings]);

  useEffect(() => {
    const onHash = () => {
      const h = readHash();
      if (h) setTab(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.undo ? 6000 : 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const go = useCallback((t: Tab) => {
    setTab(t);
    if (location.hash !== `#${t}`) history.replaceState(null, '', `#${t}`);
    window.scrollTo({ top: 0 });
    // Move focus to the new page heading for screen reader and keyboard users.
    requestAnimationFrame(() => mainRef.current?.querySelector<HTMLElement>('h1')?.focus());
  }, []);

  const say = (msg: string, undoable = false) => setToast({ msg, undo: undoable ? stateRef.current : undefined, id: Date.now() });

  const doneTask = (t: Task, extra = '') => {
    say(`${extra}Done: “${t.text}”`, true);
    dispatch({ type: 'done', id: t.id });
  };

  const openCount = actionable(state.tasks).length;
  const doneToday = state.tasks.filter((t) => t.status === 'done' && (t.doneAt ?? 0) >= new Date().setHours(0, 0, 0, 0)).length;
  const focusTask = focus ? state.tasks.find((t) => t.id === focus.id) : undefined;
  const focusParent = focusTask?.parentId ? state.tasks.find((t) => t.id === focusTask.parentId) : undefined;

  const labels: Record<Exclude<Tab, 'home'>, React.ReactNode> = {
    now: 'Now',
    dump: <><span className="tab-long">Brain dump</span><span className="tab-short">Dump</span></>,
    pile: 'Pile',
    done: 'Wins',
    share: <>Share<span className="tab-long"> update</span></>,
  };
  const counts: Partial<Record<Tab, number>> = { pile: openCount, done: doneToday };

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="shell" aria-hidden={focus ? true : undefined}>
        <header className="topbar">
          <a
            href="#now"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              go(state.tasks.length ? 'now' : 'home');
            }}
          >
            <PileMark />
            <span className="brand-name">Unpile</span>
          </a>
          {tab === 'home' && state.tasks.length > 0 ? (
            <button className="icon-btn" onClick={() => go('now')}>
              Open my pile →
            </button>
          ) : (
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-haspopup="dialog">
            <span aria-hidden="true">Aa</span> Comfort
          </button>
          )}
        </header>

        {tab !== 'home' && (
        <nav aria-label="Sections">
          <div className="tabs">
            {TABS.map((t) => (
              <button key={t} className="tab" aria-current={tab === t ? 'page' : undefined} onClick={() => go(t)}>
                {labels[t as Exclude<Tab, 'home'>]}
                {counts[t] ? (
                  <span className="tab-count" aria-label={t === 'pile' ? `${counts[t]} open` : `${counts[t]} done today`}>
                    {counts[t]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </nav>
        )}

        <main id="main" ref={mainRef} tabIndex={-1} style={{ outline: 'none' }}>
        {tab === 'home' && (
            <Landing
              onStart={(sample) => {
                if (sample) {
                  try {
                    localStorage.setItem('unpile:draft', SAMPLE_DUMP);
                  } catch {
                    /* ignore */
                  }
                }
                go('dump');
              }}
            />
          )}
          {tab === 'dump' && (
            <Dump
              hasTasks={state.tasks.length > 0}
              onAdd={(items) => {
                dispatch({ type: 'add', items });
                say(`Added ${items.length} ${items.length === 1 ? 'thing' : 'things'}. Here’s where to start.`);
                go('now');
              }}
            />
          )}
          {tab === 'now' && (
            <Now
              tasks={state.tasks}
              session={state.session}
              shortcuts={!focus && !shrinking && !settingsOpen}
              onSession={(patch) => dispatch({ type: 'session', patch })}
              onStart={(t, minutes) => {
                setToast(null);
                setFocus({ id: t.id, minutes });
              }}
              onDone={(t) => doneTask(t)}
              onShrink={(t) => setShrinking(t)}
              onSkip={(t) => dispatch({ type: 'skip', id: t.id })}
              onPark={(t) => {
                say(`Parked “${t.text}” for later.`, true);
                dispatch({ type: 'park', id: t.id });
              }}
              go={go}
            />
          )}
          {tab === 'pile' && (
            <Pile
              tasks={state.tasks}
              onToggle={(t) => (t.status === 'done' ? dispatch({ type: 'reopen', id: t.id }) : doneTask(t))}
              onPark={(t) => {
                say(`Parked “${t.text}”.`, true);
                dispatch({ type: 'park', id: t.id });
              }}
              onUnpark={(t) => dispatch({ type: 'unpark', id: t.id })}
              onRemove={(t) => {
                say(`Deleted “${t.text}”.`, true);
                dispatch({ type: 'remove', id: t.id });
              }}
              onUpdate={(id, patch) => dispatch({ type: 'update', id, patch })}
              go={go}
            />
          )}
          {tab === 'done' && (
            <Done
              tasks={state.tasks}
              onReopen={(t) => dispatch({ type: 'reopen', id: t.id })}
              onClear={() => {
                say('Cleared finished tasks.', true);
                dispatch({ type: 'clearDone' });
              }}
              go={go}
            />
          )}
          {tab === 'share' && (
            <Share
              tasks={state.tasks}
              session={state.session}
              name={state.settings.name}
              onName={(name) => dispatch({ type: 'settings', patch: { name } })}
              toast={(m) => say(m)}
            />
          )}
        </main>

        <footer className="footer">
          <span>Your list never leaves this device.</span>
          <span>Made for Taskforge 2026</span>
        </footer>
      </div>

      {focus && focusTask && (
        <Focus
          key={focus.id}
          task={focusTask}
          parentText={focusParent?.text}
          minutes={focus.minutes}
          sound={state.settings.sound}
          onDone={(ms) => {
            dispatch({ type: 'focus', id: focusTask.id, ms });
            doneTask(focusTask, 'Nice. ');
            setFocus(null);
          }}
          onStop={(ms) => {
            dispatch({ type: 'focus', id: focusTask.id, ms });
            if (ms > 30_000) say(`${Math.round(ms / 60_000) || 'Under a'} minute${Math.round(ms / 60_000) === 1 ? '' : 's'} of focus saved. Progress is progress.`);
            setFocus(null);
          }}
        />
      )}

      {shrinking && (
        <ShrinkDialog
          task={shrinking}
          onClose={() => setShrinking(null)}
          onSave={(steps) => {
            dispatch({ type: 'split', id: shrinking.id, steps });
            say(`Split into ${steps.length} small steps. Start with the first one.`, true);
            setShrinking(null);
          }}
        />
      )}

      {settingsOpen && (
        <SettingsDialog
          state={state}
          onChange={(patch) => dispatch({ type: 'settings', patch })}
          onReplace={(s) => dispatch({ type: 'replace', state: s })}
          onClose={() => setSettingsOpen(false)}
          toast={(m) => say(m)}
        />
      )}

      <div aria-live="polite" className="sr-only">
        {toast?.msg}
      </div>
      {toast && (
        <div className="toast" key={toast.id}>
          <span>{toast.msg}</span>
          {toast.undo && (
            <button
              className="btn"
              onClick={() => {
                dispatch({ type: 'replace', state: toast.undo! });
                setToast({ msg: 'Undone.', id: Date.now() });
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}
    </>
  );
}

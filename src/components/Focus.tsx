import { useEffect, useRef, useState } from 'react';
import type { Task } from '../lib/types';

interface Props {
  task: Task;
  parentText?: string;
  minutes: number;
  sound: boolean;
  onDone: (focusMs: number) => void;
  onStop: (focusMs: number) => void;
}

function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 1.5);
    });
    setTimeout(() => ctx.close(), 2500);
  } catch {
    /* no audio: fine */
  }
}

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function Focus({ task, parentText, minutes, sound, onDone, onStop }: Props) {
  const [total, setTotal] = useState(minutes * 60_000);
  const [remaining, setRemaining] = useState(minutes * 60_000);
  const [paused, setPaused] = useState(false);
  const [announce, setAnnounce] = useState('');
  const endAt = useRef(Date.now() + minutes * 60_000);
  const worked = useRef(0);
  const lastTick = useRef(Date.now());
  const ended = remaining <= 0;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const title = useRef(document.title);

  useEffect(() => {
    headingRef.current?.focus();
    const original = title.current;
    return () => {
      document.title = original;
    };
  }, []);

  useEffect(() => {
    if (paused || ended) return;
    lastTick.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      worked.current += now - lastTick.current;
      lastTick.current = now;
      const left = endAt.current - now;
      setRemaining(left);
      if (left <= 0) {
        setAnnounce('Time’s up. Nice work staying with it.');
        if (sound) chime();
      } else if (Math.abs(left - 60_000) < 500) {
        setAnnounce('One minute left.');
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [paused, ended, sound]);

  useEffect(() => {
    document.title = ended ? 'Time’s up · Unpile' : `${fmt(remaining)} · ${task.text}`;
  }, [remaining, ended, task.text]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStop(worked.current);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStop]);

  function togglePause() {
    if (paused) {
      endAt.current = Date.now() + remaining;
      setPaused(false);
      setAnnounce('Timer running.');
    } else {
      setPaused(true);
      setAnnounce('Paused.');
    }
  }

  function more(min: number) {
    endAt.current = Date.now() + min * 60_000;
    setTotal(min * 60_000);
    setRemaining(min * 60_000);
    setPaused(false);
    setAnnounce(`${min} more minutes. Go.`);
  }

  const pct = Math.min(100, Math.max(0, ((total - remaining) / total) * 100));

  return (
    <div className="focus" role="dialog" aria-modal="true" aria-labelledby="focus-task">
      <div className="focus-inner">
        <p className="sr-only" role="status" aria-live="assertive">
          {announce}
        </p>
        {!ended && !paused && <div className="breathe" aria-hidden="true" />}
        <p className="eyebrow">{ended ? 'Time’s up' : paused ? 'Paused' : parentText ? `Part of “${parentText}”` : 'Just this'}</p>
        <h1 id="focus-task" className="focus-task" ref={headingRef} tabIndex={-1}>
          {task.text}
        </h1>

        {!ended ? (
          <>
            <div className="clock" role="timer" aria-label={`${fmt(remaining)} remaining`}>
              {fmt(remaining)}
            </div>
            <div className="track" aria-hidden="true">
              <i style={{ width: `${pct}%` }} />
            </div>
            <div className="focus-actions">
              <button className="btn btn-good btn-lg" onClick={() => onDone(worked.current)}>
                I did it
              </button>
              <button className="btn btn-lg" onClick={togglePause}>
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button className="btn btn-quiet btn-lg" onClick={() => onStop(worked.current)}>
                Stop
              </button>
            </div>
            <p className="focus-note">Everything else can wait. If a thought pops up, let it go — it’s safe in the pile.</p>
          </>
        ) : (
          <>
            <p className="lede" style={{ margin: '0 auto 28px' }}>
              You stayed with it for {Math.max(1, Math.round(worked.current / 60_000))} {Math.round(worked.current / 60_000) === 1 ? 'minute' : 'minutes'}. That counts. How did it go?
            </p>
            <div className="focus-actions">
              <button className="btn btn-good btn-lg" onClick={() => onDone(worked.current)}>
                Done ✓
              </button>
              <button className="btn btn-lg" onClick={() => more(5)}>
                5 more minutes
              </button>
              <button className="btn btn-quiet btn-lg" onClick={() => onStop(worked.current)}>
                Not finished — that’s okay
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

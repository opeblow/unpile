import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { parseDump, type ParsedItem } from '../lib/parse';
import { SAMPLE_DUMP } from '../lib/sample';
import { dueLabel } from '../lib/dates';
import { EnergyBars, ENERGY_TASK_LABEL, minutesLabel } from './ui';

const DRAFT_KEY = 'unpile:draft';

// Minimal typing for the browser speech API (Chrome, Edge, Safari).
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
function getRecognition(): (new () => Recognition) | undefined {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => Recognition) | undefined;
}

interface Props {
  hasTasks: boolean;
  onAdd: (items: ParsedItem[]) => void;
}

export function Dump({ hasTasks, onAdd }: Props) {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(DRAFT_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const deferred = useDeferredValue(text);
  const items = useMemo(() => parseDump(deferred), [deferred]);
  const Speech = useMemo(getRecognition, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, text);
    } catch {
      /* ignore */
    }
  }, [text]);

  useEffect(() => () => recRef.current?.stop(), []);

  function toggleMic() {
    if (!Speech) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Speech();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = navigator.language || 'en-US';
    rec.onresult = (e) => {
      let said = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) said += e.results[i][0].transcript.trim() + '\n';
      }
      // Saying "next" starts a new task.
      said = said.replace(/\s*\bnext( one| thing)?\b\s*/gi, '\n');
      if (said.trim()) setText((t) => (t && !t.endsWith('\n') ? t + '\n' : t) + said);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  function submit() {
    if (items.length === 0) return;
    recRef.current?.stop();
    onAdd(items);
    setText('');
  }

  return (
    <section aria-labelledby="dump-title" className="fade-in">
      <div className="page-head">
        <p className="eyebrow">Step 1 · Get it out of your head</p>
        <h1 id="dump-title">{hasTasks ? 'What else is on your mind?' : 'What’s on your mind?'}</h1>
        <p className="lede">
          Type or say everything, in any order. Messy is fine — “essay due friday!!”, “call mum”, “laundry, dishes”. Unpile sorts it out.
        </p>
      </div>

      <div className="dump-box">
        <label htmlFor="dump" className="sr-only">
          Everything you need to do, one per line or however it comes out
        </label>
        <textarea
          id="dump"
          ref={areaRef}
          className="dump"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={'history essay due friday!!\nreply to Tola\npay school fees asap\nlaundry, dishes…'}
          spellCheck
          autoFocus={!hasTasks}
        />
        <div className="dump-tools">
          {Speech ? (
            <button type="button" className="icon-btn mic" aria-pressed={listening} onClick={toggleMic}>
              <span className="dot" aria-hidden="true" />
              {listening ? 'Listening… tap to stop' : 'Say it instead'}
            </button>
          ) : (
            <span />
          )}
          {text && (
            <button type="button" className="btn-quiet btn" onClick={() => setText('')}>
              Clear
            </button>
          )}
        </div>
      </div>
      {listening && (
        <p className="muted" role="status">
          Speak naturally. Say “next” between tasks.
        </p>
      )}

      <div className="dump-actions">
        <button type="button" className="btn btn-primary btn-lg" onClick={submit} disabled={items.length === 0}>
          {items.length === 0 ? 'Add to my pile' : `Add ${items.length} ${items.length === 1 ? 'thing' : 'things'} to my pile`}
          <span className="kbd" aria-hidden="true">
            Ctrl ↵
          </span>
        </button>
        {!text && (
          <button type="button" className="link-btn" onClick={() => setText(SAMPLE_DUMP)}>
            Try it with a sample messy list
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="preview" aria-live="polite">
          <div className="preview-head">
            <h2>Here’s what I found</h2>
            <span className="muted">Not right? Just edit the text above.</span>
          </div>
          <ol className="list">
            {items.map((it, i) => (
              <li className="row" key={i} style={{ gridTemplateColumns: 'auto 1fr' }}>
                <span className="row-num" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="row-main">
                  <div className="row-title">{it.text}</div>
                  <div className="row-meta">
                    {it.urgent && <span className="chip chip-due">Urgent</span>}
                    {it.due && <span className="chip chip-due">{dueLabel(it.due)}</span>}
                    <span className="chip">{minutesLabel(it.minutes)}</span>
                    <span className="chip">
                      <EnergyBars energy={it.energy} /> {ENERGY_TASK_LABEL[it.energy]}
                    </span>
                    {it.tags.map((t) => (
                      <span className="chip" key={t}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

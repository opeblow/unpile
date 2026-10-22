import { useEffect, useMemo, useState } from 'react';
import { buildUpdate, type Tone, type Window } from '../lib/share';
import type { Session, Task } from '../lib/types';
import { Segmented } from './ui';

interface Props {
  tasks: Task[];
  session: Session;
  name: string;
  onName: (name: string) => void;
  toast: (msg: string) => void;
}

export function Share({ tasks, session, name, onName, toast }: Props) {
  const [to, setTo] = useState('');
  const [tone, setTone] = useState<Tone>('friendly');
  const [win, setWin] = useState<Window>('today');
  const [help, setHelp] = useState('');
  const generated = useMemo(
    () => buildUpdate({ tasks, session, tone, window: win, to, from: name, help }),
    [tasks, session, tone, win, to, name, help]
  );
  const [text, setText] = useState(generated);
  useEffect(() => setText(generated), [generated]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied. Paste it anywhere.');
    } catch {
      toast('Couldn’t copy — select the text and copy it yourself.');
    }
  }

  async function share() {
    try {
      await navigator.share({ text });
    } catch {
      /* cancelled */
    }
  }

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;
  const subject = tone === 'formal' ? 'Progress update' : 'Quick update';

  return (
    <section aria-labelledby="share-title" className="fade-in">
      <div className="page-head">
        <p className="eyebrow">Step 3 · Tell someone</p>
        <h1 id="share-title">Write the update for you</h1>
        <p className="lede">
          Telling a tutor, teammate or parent where you’re at is hard when you’re overwhelmed. Unpile drafts it from what you’ve actually done.
        </p>
      </div>

      <div className="share-grid">
        <div className="two">
          <label>
            <span className="field-label">Who’s it for?</span>
            <input className="input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="e.g. Dr. Okafor, team, Mum" />
          </label>
          <label>
            <span className="field-label">Your name</span>
            <input className="input" value={name} onChange={(e) => onName(e.target.value)} placeholder="Optional" />
          </label>
        </div>
        <div className="two">
          <Segmented<Tone>
            legend="Tone"
            name="tone"
            value={tone}
            onChange={setTone}
            options={[
              { value: 'friendly', label: 'Friendly' },
              { value: 'formal', label: 'Formal' },
            ]}
          />
          <Segmented<Window>
            legend="Covering"
            name="window"
            value={win}
            onChange={setWin}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This week' },
            ]}
          />
        </div>
        <label>
          <span className="field-label">Anything you need help with? (optional)</span>
          <input
            className="input"
            value={help}
            onChange={(e) => setHelp(e.target.value)}
            placeholder="e.g. I’m not sure what the essay question means"
          />
        </label>

        <div>
          <label htmlFor="letter" className="field-label">
            Your message — edit freely
          </label>
          <textarea id="letter" className="letter" value={text} onChange={(e) => setText(e.target.value)} />
        </div>

        <div className="one-actions">
          <button className="btn btn-primary btn-lg" onClick={copy}>
            Copy message
          </button>
          {canShare && (
            <button className="btn btn-lg" onClick={share}>
              Share…
            </button>
          )}
          <a className="btn btn-lg" href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`}>
            Open in email
          </a>
        </div>
      </div>
    </section>
  );
}

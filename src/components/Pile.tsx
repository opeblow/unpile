import { useState } from 'react';
import { daysUntil } from '../lib/dates';
import type { Energy, Task } from '../lib/types';
import { TaskChips } from './ui';

interface Props {
  tasks: Task[];
  onToggle: (t: Task) => void;
  onPark: (t: Task) => void;
  onUnpark: (t: Task) => void;
  onRemove: (t: Task) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  go: (tab: 'dump' | 'now') => void;
}

function sortKey(t: Task) {
  return (t.urgent ? -1000 : 0) + (t.due ? daysUntil(t.due) : 999);
}

export function Pile({ tasks, onToggle, onPark, onUnpark, onRemove, onUpdate, go }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const top = tasks.filter((t) => !t.parentId);
  const active = top.filter((t) => t.status === 'open' || t.status === 'split').sort((a, b) => sortKey(a) - sortKey(b));
  const soon = active.filter((t) => t.urgent || (t.due && daysUntil(t.due) <= 3));
  const later = active.filter((t) => !soon.includes(t));
  const parked = top.filter((t) => t.status === 'parked');

  const row = (t: Task) => {
    const steps = tasks.filter((s) => s.parentId === t.id).sort((a, b) => a.order - b.order);
    const doneSteps = steps.filter((s) => s.status === 'done').length;
    const nextStep = steps.find((s) => s.status === 'open');
    if (editing === t.id) return <EditRow key={t.id} task={t} onCancel={() => setEditing(null)} onSave={(p) => (onUpdate(t.id, p), setEditing(null))} />;
    return (
      <li className="row" key={t.id}>
        <input
          type="checkbox"
          className="check"
          checked={t.status === 'done'}
          onChange={() => onToggle(t)}
          aria-label={`Mark “${t.text}” as done`}
        />
        <div className="row-main">
          <div className="row-title">{t.text}</div>
          <div className="row-meta">
            {steps.length > 0 && (
              <span className="chip chip-good">
                {doneSteps} of {steps.length} steps
              </span>
            )}
            <TaskChips task={t} />
          </div>
          {steps.length > 0 && (
            <ul className="substeps" aria-label={`Steps for ${t.text}`}>
              {steps.map((s) => (
                <li key={s.id} className={s.status === 'done' ? 'is-done' : s === nextStep ? 'is-next' : ''}>
                  <span aria-hidden="true">{s.status === 'done' ? '✓' : s === nextStep ? '→' : '·'}</span>
                  <span>
                    {s.text}
                    {s.status === 'done' && <span className="sr-only"> (done)</span>}
                    {s === nextStep && <span className="sr-only"> (next)</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="row-actions">
          <button className="btn btn-quiet" onClick={() => setEditing(t.id)} aria-label={`Edit “${t.text}”`}>
            Edit
          </button>
          {t.status === 'parked' ? (
            <button className="btn btn-quiet" onClick={() => onUnpark(t)} aria-label={`Bring back “${t.text}”`}>
              Bring back
            </button>
          ) : (
            <button className="btn btn-quiet" onClick={() => onPark(t)} aria-label={`Park “${t.text}”`}>
              Park
            </button>
          )}
          <button className="btn btn-quiet" onClick={() => onRemove(t)} aria-label={`Delete “${t.text}”`}>
            Delete
          </button>
        </div>
      </li>
    );
  };

  const group = (title: string, hint: string, list: Task[]) =>
    list.length > 0 && (
      <section className="group" aria-label={title}>
        <div className="group-head">
          <h2>{title}</h2>
          <span className="muted">{hint}</span>
        </div>
        <ul className="list">{list.map(row)}</ul>
      </section>
    );

  return (
    <section aria-labelledby="pile-title" className="fade-in">
      <div className="page-head">
        <p className="eyebrow">The whole pile</p>
        <h1 id="pile-title">Everything, in one calm place</h1>
        <p className="lede">
          You don’t need to work from here. This is just so you know nothing is lost.{' '}
          <button className="link-btn" onClick={() => go('now')}>
            Back to one thing
          </button>
        </p>
      </div>

      {active.length + parked.length === 0 ? (
        <div className="empty">
          <h2>The pile is empty</h2>
          <p>Nothing waiting. Add things whenever they pop into your head.</p>
          <button className="btn btn-primary" onClick={() => go('dump')}>
            Add things
          </button>
        </div>
      ) : (
        <>
          {group('Soon', `${soon.length} due in the next few days`, soon)}
          {group('Whenever', `${later.length} with no rush`, later)}
          {group('Parked', 'Not now — and that’s fine', parked)}
        </>
      )}
    </section>
  );
}

function EditRow({ task, onSave, onCancel }: { task: Task; onSave: (p: Partial<Task>) => void; onCancel: () => void }) {
  const [text, setText] = useState(task.text);
  const [due, setDue] = useState(task.due ?? '');
  const [minutes, setMinutes] = useState(task.minutes);
  const [energy, setEnergy] = useState<Energy>(task.energy);
  return (
    <li className="row" style={{ gridTemplateColumns: '1fr' }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) onSave({ text: text.trim(), due: due || undefined, minutes, energy });
        }}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
        style={{ display: 'grid', gap: 10 }}
      >
        <label className="sr-only" htmlFor={`t-${task.id}`}>
          Task
        </label>
        <input id={`t-${task.id}`} className="input" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
        <div className="two" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <label>
            <span className="field-label">Due</span>
            <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
          <label>
            <span className="field-label">Minutes</span>
            <input
              className="input"
              type="number"
              min={1}
              max={600}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
          <label>
            <span className="field-label">Focus needed</span>
            <select className="input" value={energy} onChange={(e) => setEnergy(e.target.value as Energy)}>
              <option value="low">Light</option>
              <option value="medium">Some focus</option>
              <option value="high">Deep focus</option>
            </select>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      </form>
    </li>
  );
}

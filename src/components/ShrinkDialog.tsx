import { useEffect, useRef, useState } from 'react';
import { suggestSteps, type Step } from '../lib/shrink';
import type { Task } from '../lib/types';

interface Props {
  task: Task;
  onSave: (steps: Step[]) => void;
  onClose: () => void;
}

export function ShrinkDialog({ task, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [steps, setSteps] = useState<Step[]>(() => suggestSteps(task.text));

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const set = (i: number, p: Partial<Step>) => setSteps((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const valid = steps.filter((s) => s.text.trim());
  const total = valid.reduce((n, s) => n + s.minutes, 0);

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="shrink-title">
      <form
        className="dlg"
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid.length) onSave(valid.map((s) => ({ ...s, text: s.text.trim() })));
        }}
      >
        <div className="dlg-head">
          <div>
            <p className="eyebrow">Shrink it</p>
            <h2 id="shrink-title">“{task.text}” in tiny steps</h2>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              The first step is so small it’s almost silly. That’s the point. Change anything you like.
            </p>
          </div>
        </div>

        <ol className="list" style={{ marginTop: 8 }}>
          {steps.map((s, i) => (
            <li className="step-edit" key={i}>
              <span className="row-num" aria-hidden="true">
                {i + 1}
              </span>
              <input
                className="input"
                value={s.text}
                aria-label={`Step ${i + 1}`}
                onChange={(e) => set(i, { text: e.target.value })}
                autoFocus={i === 0}
              />
              <div className="min-input">
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={240}
                  inputMode="numeric"
                  value={s.minutes}
                  aria-label={`Minutes for step ${i + 1}`}
                  onChange={(e) => set(i, { minutes: Math.max(1, Math.min(240, Number(e.target.value) || 1)) })}
                />
                <span aria-hidden="true">min</span>
              </div>
              <button
                type="button"
                className="btn btn-quiet"
                aria-label={`Remove step ${i + 1}`}
                onClick={() => setSteps((x) => x.filter((_, j) => j !== i))}
                disabled={steps.length <= 1}
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="link-btn"
          style={{ marginTop: 6 }}
          onClick={() => setSteps((s) => [...s, { text: '', minutes: 10, energy: 'medium' }])}
        >
          + Add a step
        </button>

        <div className="dlg-foot">
          <span className="muted" style={{ marginRight: 'auto', alignSelf: 'center' }}>
            {valid.length} steps · about {total} min total
          </span>
          <button type="button" className="btn" onClick={() => ref.current?.close()}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!valid.length}>
            Use these steps
          </button>
        </div>
      </form>
    </dialog>
  );
}

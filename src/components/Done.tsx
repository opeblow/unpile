import type { Task } from '../lib/types';

interface Props {
  tasks: Task[];
  onReopen: (t: Task) => void;
  onClear: () => void;
  go: (tab: 'now' | 'share') => void;
}

const DAY = 86_400_000;

export function Done({ tasks, onReopen, onClear, go }: Props) {
  const startToday = new Date().setHours(0, 0, 0, 0);
  const byId = new Map(tasks.map((t) => [t.id, t]));
  // Count every finished step and task: small wins are the whole idea.
  const done = tasks.filter((t) => t.status === 'done').sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  const today = done.filter((t) => (t.doneAt ?? 0) >= startToday);
  const week = done.filter((t) => (t.doneAt ?? 0) >= startToday - 6 * DAY);
  const focusMin = Math.round(tasks.reduce((n, t) => n + t.focusMs, 0) / 60_000);

  const groups = new Map<string, Task[]>();
  for (const t of done) {
    const d = new Date(t.doneAt ?? 0);
    const key =
      (t.doneAt ?? 0) >= startToday
        ? 'Today'
        : (t.doneAt ?? 0) >= startToday - DAY
          ? 'Yesterday'
          : d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  return (
    <section aria-labelledby="done-title" className="fade-in">
      <div className="page-head">
        <p className="eyebrow">Wins</p>
        <h1 id="done-title">{today.length ? `You did ${today.length} ${today.length === 1 ? 'thing' : 'things'} today.` : 'Nothing yet today — and that’s okay.'}</h1>
        <p className="lede">
          {today.length
            ? 'Every one counts, including the tiny ones. No streaks to break here.'
            : 'One tiny step is enough to start. Your list isn’t going anywhere.'}
        </p>
      </div>

      <div className="tally">
        <div>
          <b>{today.length}</b>
          <span>done today</span>
        </div>
        <div>
          <b>{week.length}</b>
          <span>this week</span>
        </div>
        <div>
          <b>{focusMin}</b>
          <span>focused minutes</span>
        </div>
      </div>

      {done.length === 0 ? (
        <div className="empty">
          <h2>Your wins will show up here</h2>
          <p>Finish anything — even “open the doc” — and it lands here.</p>
          <button className="btn btn-primary" onClick={() => go('now')}>
            Find my one thing
          </button>
        </div>
      ) : (
        <>
          {[...groups].map(([label, list]) => (
            <section className="group" key={label} aria-label={label}>
              <div className="group-head">
                <h2>{label}</h2>
                <span className="muted">{list.length} done</span>
              </div>
              <ul className="list">
                {list.map((t) => {
                  const parent = t.parentId ? byId.get(t.parentId) : undefined;
                  return (
                    <li className="row" key={t.id}>
                      <input type="checkbox" className="check" checked onChange={() => onReopen(t)} aria-label={`Undo: “${t.text}” is not done`} />
                      <div className="row-main">
                        <div className="row-title">{t.text}</div>
                        {parent && <div className="muted" style={{ fontSize: '0.9rem' }}>Step of “{parent.text}”</div>}
                      </div>
                      <span className="muted" style={{ fontSize: '0.85rem' }}>
                        {new Date(t.doneAt ?? 0).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <div className="one-actions">
            <button className="btn btn-primary" onClick={() => go('share')}>
              Tell someone how it’s going
            </button>
            <button className="btn btn-quiet" onClick={onClear}>
              Clear finished tasks
            </button>
          </div>
        </>
      )}
    </section>
  );
}

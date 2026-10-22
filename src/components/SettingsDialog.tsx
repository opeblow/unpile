import { useEffect, useRef } from 'react';
import type { AppState, Settings } from '../lib/types';
import { sanitize } from '../lib/store';
import { Segmented } from './ui';

interface Props {
  state: AppState;
  onChange: (p: Partial<Settings>) => void;
  onReplace: (s: AppState) => void;
  onClose: () => void;
  toast: (msg: string) => void;
}

export function SettingsDialog({ state, onChange, onReplace, onClose, toast }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const s = state.settings;

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `unpile-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importData(file: File) {
    try {
      onReplace(sanitize(JSON.parse(await file.text())));
      toast('Backup restored.');
      ref.current?.close();
    } catch {
      toast('That file didn’t look like an Unpile backup.');
    }
  }

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="settings-title">
      <div className="dlg">
        <div className="dlg-head">
          <div>
            <p className="eyebrow">Make it yours</p>
            <h2 id="settings-title">Comfort settings</h2>
          </div>
          <button className="icon-btn" onClick={() => ref.current?.close()} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="settings-grid">
          <Segmented<Settings['textScale']>
            legend="Text size"
            name="scale"
            value={s.textScale}
            onChange={(textScale) => onChange({ textScale })}
            options={[
              { value: 1, label: 'Regular' },
              { value: 1.15, label: 'Large' },
              { value: 1.3, label: 'Extra large' },
            ]}
          />
          <Segmented<Settings['font']>
            legend="Reading font"
            name="font"
            value={s.font}
            onChange={(font) => onChange({ font })}
            options={[
              { value: 'atkinson', label: <span style={{ fontFamily: 'Atkinson Hyperlegible' }}>Atkinson Hyperlegible</span> },
              { value: 'lexend', label: <span style={{ fontFamily: 'Lexend' }}>Lexend</span> },
            ]}
          />
          <label className="toggle">
            <span>
              High contrast
              <small>Pure black on white, stronger borders.</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="switch"
              checked={s.contrast === 'high'}
              onChange={(e) => onChange({ contrast: e.target.checked ? 'high' : 'normal' })}
            />
          </label>
          <label className="toggle">
            <span>
              Calm motion
              <small>Turns off all animation.</small>
            </span>
            <input type="checkbox" role="switch" className="switch" checked={s.reduceMotion} onChange={(e) => onChange({ reduceMotion: e.target.checked })} />
          </label>
          <label className="toggle">
            <span>
              Soft chime when time’s up
              <small>A quiet three-note sound.</small>
            </span>
            <input type="checkbox" role="switch" className="switch" checked={s.sound} onChange={(e) => onChange({ sound: e.target.checked })} />
          </label>

          <div>
            <p className="field-label">Your data</p>
            <p className="muted" style={{ marginTop: 0 }}>
              Everything stays in this browser. No account, no server, no tracking.
            </p>
            <div className="one-actions">
              <button className="btn" onClick={exportData}>
                Download backup
              </button>
              <button className="btn" onClick={() => fileRef.current?.click()}>
                Restore backup
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
              />
              <button
                className="btn btn-quiet"
                onClick={() => {
                  if (confirm('Delete every task and start fresh? This can’t be undone.')) {
                    onReplace({ ...state, tasks: [] });
                    ref.current?.close();
                  }
                }}
              >
                Start fresh
              </button>
            </div>
          </div>

          <div>
            <p className="field-label">Keyboard shortcuts</p>
            <p className="muted" style={{ margin: 0 }}>
              On the “Now” screen: <span className="kbd">↵</span> start · <span className="kbd">D</span> done · <span className="kbd">S</span> shrink ·{' '}
              <span className="kbd">N</span> another · <span className="kbd">P</span> park · <span className="kbd">Esc</span> leave focus mode. In the brain dump:{' '}
              <span className="kbd">Ctrl</span>+<span className="kbd">↵</span> to add.
            </p>
          </div>
        </div>
      </div>
    </dialog>
  );
}

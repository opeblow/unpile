import { SAMPLE_DUMP } from '../lib/sample';
import { Bars } from './ui';

interface Props {
  onStart: (withSample: boolean) => void;
}

const PILE = [
  'Reply to Tola about the group project',
  'Study for stats quiz',
  'Laundry',
  'Fix the login bug on the club website',
  'Apply for the summer internship',
  'Call mum',
  'Read chapter 4 for bio',
];

export function Landing({ onStart }: Props) {
  return (
    <div className="landing fade-in">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">For the days your to-do list wins</p>
          <h1 id="hero-title">
            Your list is long.
            <br />
            <em>Your next step isn’t.</em>
          </h1>
          <p className="lede">
            Unpile takes everything in your head — messy, all at once — and shows you one thing that fits the energy and time you actually have
            right now.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={() => onStart(false)}>
              Empty my head
            </button>
            <button className="btn btn-lg" onClick={() => onStart(true)}>
              Try a sample list
            </button>
          </div>
          <p className="muted hero-note">Free · No account · Works offline · Nothing leaves your device</p>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="pile-stack">
            {PILE.map((t, i) => (
              <div className="pile-card" key={t} style={{ ['--i' as string]: i }}>
                {t}
              </div>
            ))}
          </div>
          <div className="hero-one">
            <span className="eyebrow" style={{ margin: 0 }}>
              Your one thing
            </span>
            <strong>Pay school fees</strong>
            <span className="hero-chips">
              <span className="chip chip-due">You marked it urgent</span>
              <span className="chip chip-good">Fits in your 15 minutes</span>
            </span>
            <span className="hero-start">Start · 10 min</span>
          </div>
        </div>
      </section>

      <section className="how" aria-labelledby="how-title">
        <h2 id="how-title">Three steps. One at a time.</h2>
        <ol className="how-grid">
          <li>
            <span className="how-num">1</span>
            <h3>Empty your head</h3>
            <p>Type or say it all. “essay due friday!!”, “pay fees asap”, “laundry, dishes”. Unpile finds the tasks, dates, urgency and time.</p>
            <pre className="how-sample">{SAMPLE_DUMP.split('\n').slice(1, 5).join('\n')}</pre>
          </li>
          <li>
            <span className="how-num">2</span>
            <h3>Get one thing</h3>
            <p>Tell it how you feel and how long you’ve got. It picks one task and says why. Too big? It shrinks it to a 3-minute first step.</p>
            <div className="how-energy">
              <span className="chip">
                <Bars level={1} /> Running low
              </span>
              <span className="chip">
                <Bars level={2} /> Okay
              </span>
              <span className="chip">
                <Bars level={3} /> Sharp
              </span>
            </div>
          </li>
          <li>
            <span className="how-num">3</span>
            <h3>Tell someone</h3>
            <p>Behind on something? Unpile drafts a kind, clear update for your tutor, team or family from what you actually did.</p>
            <div className="how-msg">
              Hello Dr. Okafor,
              <br />
              Here is a short update on my progress today…
            </div>
          </li>
        </ol>
      </section>

      <section className="principles" aria-label="What Unpile promises">
        <div>
          <h3>No guilt</h3>
          <p>No streaks, no red alarms. Parking a task is a valid choice. “Not finished — that’s okay” is a button.</p>
        </div>
        <div>
          <h3>Built to be read</h3>
          <p>Atkinson Hyperlegible type, large text, high contrast, voice input, full keyboard and screen-reader support.</p>
        </div>
        <div>
          <h3>Yours alone</h3>
          <p>No account, no server, no tracking. Your list lives in your browser and works offline.</p>
        </div>
      </section>

      <section className="closer">
        <h2>Start with the smallest possible step.</h2>
        <button className="btn btn-primary btn-lg" onClick={() => onStart(false)}>
          Empty my head
        </button>
      </section>
    </div>
  );
}

# AGENTS.md

Guidance for AI coding agents (and humans) working on Unpile.

## What this is

Unpile turns an overwhelming to-do list into one calm next step. Static React + TypeScript + Vite app. No backend, no network calls, no AI APIs: every feature runs on-device. Keep it that way.

## Commands

```bash
npm install
npm run dev        # local dev server
npm test           # vitest unit tests — must pass
npm run build      # tsc (strict) + vite build — must pass
```

Run `npm test` and `npm run build` before you say a change is done.

## Layout

```
src/
  lib/            pure logic, no React. All tests live here.
    types.ts      Task, Settings, Session, AppState
    parse.ts      brain dump → tasks (splitting, dates, urgency, duration, effort guess)
    pick.ts       chooses ONE task for energy + time, returns plain-language reasons
    shrink.ts     task → small concrete steps (recipe table, leading verb wins)
    store.ts      reducer, localStorage load/save, sanitize for imports
    share.ts      builds the progress update message
    dates.ts      local yyyy-mm-dd helpers
    sample.ts     the demo list
    lib.test.ts   unit tests
  components/     one file per screen/dialog; ui.tsx holds shared bits
  App.tsx         tabs, toasts + undo, focus mode, dialogs
  styles.css      all styling, design tokens on :root
public/           icon, manifest, offline service worker
```

## Rules

- **Logic goes in `src/lib`, tested.** Components stay thin. Pass `now` into date-dependent functions so tests are deterministic.
- **State changes go through the reducer** in `store.ts`. If you add a field to `Task` or `Settings`, give it a default in `sanitize()` so old saved data still loads.
- **A split task** has `status: 'split'`; its steps have `parentId` and `order`. Only the first open step is actionable. When all steps are done the parent becomes done automatically. Parking a step parks the parent.
- **Tone of copy:** short, kind, plain English. Never guilt (“you’re behind”, streaks, red overdue alarms). Every suggestion should explain *why*.
- **Design:** warm paper (`--paper`), ink text, one accent (`--accent`, vermilion). Fraunces for headings, Atkinson Hyperlegible for body. No gradients, no purple, no dark glassmorphism, no emoji-heavy UI. Use the existing tokens; don’t add new colours casually.
- **Accessibility is a feature, not polish:** real form controls (radios for segmented pills), visible focus rings, labels on every input, `aria-live` for changing content, 44px minimum tap targets, respect reduced motion, test at 390px wide.
- **Privacy:** no analytics, no external requests, no fonts from CDNs (fonts are bundled via @fontsource).
- Keep dependencies minimal. Ask before adding one.

## Adding a shrink recipe

Add an entry to `RECIPES` in `src/lib/shrink.ts`: a `match` regex and 3–5 steps `[text, minutes, energy]`. First step must be ≤5 minutes and physical (“open”, “find”, “write one line”). `{t}` is replaced with the task’s subject. Add a test.

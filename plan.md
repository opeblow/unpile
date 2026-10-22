# Plan — Unpile

Deadline: **Oct 24, 2026 @ 2:00pm PDT**. Judged on **Impact** and **Technical Execution**.

## The pitch in one line

When your to-do list is so long you freeze, Unpile turns the pile into **one next step** that fits your energy and time right now.

## User and barrier (what the brief asks for)

- **User:** a student juggling coursework, money, chores and family — often with ADHD, anxiety or burnout — who opens their to-do list and shuts down.
- **Barrier:** task paralysis. A long list doesn’t tell you what to do *now*; it just shouts. Big tasks (“history essay”) have no obvious first move. And when you fall behind, telling your tutor or team feels impossible.
- **Meaningful change:** from “30 things, can’t start” to “one 3-minute step, started”, plus a ready-to-send update for the people waiting on you.

## Core flow (all built)

1. **Brain dump** — type or speak everything, messy. On-device parser pulls out tasks, due dates (“friday”, “tmrw”, “24th oct”, “next week”), urgency (“asap”, “!!”), time (“40 min”), tags, and guesses effort + focus needed. Live preview.
2. **Now** — check in: energy (running low / okay / sharp) and time (5–90+ min). Unpile shows **one** task with plain-language reasons (“Due tomorrow · Fits in your 15 minutes”). The rest of the pile stays hidden.
3. **Shrink it** — turns a scary task into 3–5 concrete steps; the first is always ≤5 minutes (“Open a blank doc and name it…”). Editable. Steps then appear one at a time.
4. **Focus timer** — full-screen, calm, one task. Gentle chime, “5 more minutes”, and “Not finished — that’s okay”.
5. **Stuck options** — show me another (skips sink, no nagging), park for later, undo for everything.
6. **Wins** — what you finished today/this week and focused minutes. No streaks, no guilt.
7. **Share update** — drafts a friendly or formal progress message to a tutor/team/parent from real data. Copy / share / email.
8. **Comfort settings** — text size, Atkinson Hyperlegible or Lexend font, high contrast, calm motion, sound, backup/restore.

## Why it scores

**Impact**
- Solves a specific, common, painful moment, not “yet another to-do app”.
- Accessible by default: hyperlegible font, keyboard shortcuts, screen-reader labels and live regions, voice input, reduced motion, high contrast, 44px+ tap targets.
- Private: no account, no server, works offline. Safe for students with sensitive situations.

**Technical execution**
- Strict TypeScript, pure logic in `src/lib` separated from UI, 21 unit tests.
- Deterministic, explainable picker (every suggestion says *why*).
- Robust state: reducer + versioned `localStorage` + sanitising import, undo.
- PWA manifest + offline service worker; ~64 kB gzipped JS.

## Remaining checklist (do these in order)

- [ ] Push to GitHub and deploy (see `setup.md`) — put the live link everywhere
- [ ] Record the demo video (script below), upload to YouTube (unlisted is fine)
- [ ] Take 4–5 screenshots: brain dump preview, Now card, Shrink dialog, focus timer, share update
- [ ] Fill the Devpost page using `DEVPOST.md` (copy-paste sections)
- [ ] Add every team member on Devpost
- [ ] Submit **before** Oct 24, 2:00pm PDT (aim for the 23rd)

## Demo video script (≈2 minutes)

1. **0:00 Hook (15s):** “This is my to-do list on a bad week.” Show the messy sample. “Looking at it, I do nothing.”
2. **0:15 Dump (20s):** paste/say it. Show the preview: dates, urgency, time pulled out automatically.
3. **0:35 Now (25s):** set “Running low, 15 min” → Pay school fees. Switch to “Sharp, 90 min” → History essay. Open “Why this one?”.
4. **1:00 Shrink (20s):** hit *Too big — shrink it*. First step: “Open a blank doc and name it…”. Use steps.
5. **1:20 Focus (15s):** start the timer, press *I did it*. Step 2 appears; dots move.
6. **1:35 Tell someone (15s):** Share update → formal → to “Dr. Okafor” → copy.
7. **1:50 Close (10s):** Comfort settings flash (big text, high contrast). “No account. Nothing leaves your device. One calm next step.”

## Nice-to-haves only if time is left

- Gentle daily check-in reminder (Notification API)
- Recurring tasks
- Translate the parser’s date words (Yoruba/Pidgin/French) — strong inclusion story

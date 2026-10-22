# Devpost submission text (copy-paste)

**Project name:** Unpile

**Tagline (short):** Turn an overwhelming to-do list into one calm next step.

**Built with:** react, typescript, vite, vitest, css, web-speech-api, pwa, github-pages

---

## Inspiration

Most to-do apps assume the hard part is *remembering* tasks. For many students it isn’t. The hard part is the moment you open a list of 25 things — essay, school fees, a group project reply, laundry — and your brain just stops. People with ADHD call it task paralysis, but almost everyone has had a week like that.

A longer, better-organised list doesn’t fix that moment. It makes it worse. So I wanted to build the opposite: a tool that hides the pile and only ever shows you one thing.

## What it does

Unpile is built around one student on a bad week.

1. **Brain dump.** Type or speak everything, in any order: “history essay due friday!!”, “pay school fees asap”, “laundry, dishes, take out the bin”. Unpile splits it into tasks and pulls out due dates, urgency, time estimates and tags, then guesses how much focus each one needs. It even drops filler like “ugh ok, so much to do”.
2. **One thing.** You tell it how you feel (*running low / okay / sharp*) and how long you have (5–90 min). It shows **one** task and tells you why: “You marked it urgent · Fits in your 15 minutes”. Low energy gets small, urgent things. High energy gets the big deadline. The rest of the pile waits quietly out of sight.
3. **Shrink it.** If a task is too big, one tap turns it into 3–5 concrete steps. The first is always tiny and physical: “Open a blank doc and name it ‘history essay’”. Then you only ever see the next step.
4. **Focus.** A calm full-screen timer for just that step. When time’s up: *Done*, *5 more minutes*, or *Not finished — that’s okay*.
5. **Stuck?** *Show me another* (skipped tasks sink so you aren’t nagged), *Park it for later*, and undo for everything.
6. **Wins.** What you finished today and this week. No streaks to break.
7. **Tell someone.** When you’re behind, writing to your tutor or team is the hardest part. Unpile drafts a friendly or formal update from what you actually did, what’s in progress and what’s next. Copy, share or email it.

## Who it’s for and the barrier it removes

**User:** a student juggling coursework, money, chores and family, often with ADHD, anxiety or burnout.
**Barrier:** task paralysis — a list that doesn’t tell you what to do *now*, big tasks with no obvious first move, and dread about updating the people waiting on you.
**Change:** from “30 things, can’t start” to “one 3-minute step, started”, plus a message ready to send.

## Accessibility

- Atkinson Hyperlegible font by default (designed for low-vision readers), Lexend as an option
- Text size up to 130%, high-contrast mode, calm-motion mode
- Voice input for people who find typing hard
- Full keyboard use with shortcuts (Enter, D, S, N, P, Esc)
- Real form controls, labels, focus rings, screen-reader announcements for timer and changes
- Works at phone width with 44px+ tap targets

## How I built it

- **React + TypeScript (strict) + Vite**, deployed as a static site. Installable and works offline (manifest + service worker).
- **All the “smart” parts run on-device with no AI service.** The parser is a set of tested rules for splitting, dates, urgency, duration and effort. The picker scores each task on deadline, fit with your time, energy match, momentum and how often you skipped it, and returns the reasons in plain words. The shrinker uses a recipe table matched on the task’s leading verb (“email tutor about essay” is an email, not an essay).
- State is a pure reducer saved to `localStorage`, with versioned data, sanitised imports, backup/restore and undo.
- 21 unit tests cover parsing, picking, shrinking, step completion, parking and the share message.

I chose rules over an AI model on purpose: it’s instant, free, private, works offline, and every suggestion can explain itself. For someone who is already overwhelmed, predictable beats clever.

## Challenges

- **Messy language.** “Friday” vs “sat exam”, “email tutor about essay” (small) vs “write essay” (big), comma lists vs real sentences. I wrote tests for each case I found and let the leading verb decide.
- **Not nagging.** Early versions kept showing the same skipped task. Skips now lower a task’s score, and “show me another” cycles through options before repeating.
- **Calm design.** Removing things was harder than adding them: no badges, no overdue alarms, no streaks.

## What I learned

- Designing for one specific person on one specific bad day gave clearer answers than designing for “productivity”.
- Explaining *why* a task was picked builds more trust than a better algorithm.
- Accessibility choices (real radio buttons, live regions, reduced motion) are easiest when you make them from the start.

## Limitations (being honest)

- The parser understands English only and guesses durations from keywords, so it can be wrong. Everything is editable.
- Shrink recipes cover common student tasks (essays, study, code, applications, email, calls, chores, payments); others get a generic first step.
- Data lives in one browser. Moving devices means backup and restore by file.
- Voice input depends on browser support (Chrome, Edge, Safari).

## What’s next

- Date words in more languages (Yoruba, Pidgin, French)
- Gentle optional reminders and recurring tasks
- Testing with student disability-support services

## Pre-existing work and AI assistance

Built from scratch during the hackathon. Open-source libraries: React, Vite, TypeScript, Vitest and fonts from Fontsource (Atkinson Hyperlegible, Fraunces, Lexend). I used an AI coding assistant (Claude) to help write and review code and documentation; the product decisions, testing and demo are my own. The sample task list is made up.

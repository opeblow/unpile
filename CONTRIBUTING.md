# Contributing to Unpile

Thanks for helping. Unpile exists for people who feel overwhelmed, so every change should make the app calmer, clearer or more accessible — never busier.

## Getting started

```bash
git clone  https://github.com/opeblow/unpile.git
cd unpile
npm install
npm run dev
```

See [setup.md](setup.md) for details and [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md) for how it fits together.

## Before you open a pull request

```bash
npm test            # unit tests (Vitest)
npm run test:e2e    # end-to-end + accessibility (Playwright + axe)
npm run build       # strict TypeScript + production build
```

All three must pass. CI runs them on every push.

## What we look for

- **Logic in `src/lib`, with tests.** Components stay thin. Pass `now` into date logic so tests are deterministic.
- **Accessibility from the start:** real form controls, labels, visible focus, `aria-live` for changing content, 44px tap targets, works at 390px wide, respects reduced motion. The axe test must stay green.
- **Kind, plain copy.** No guilt, no streaks, no alarms. Explain *why*.
- **Privacy:** no analytics, no network calls, no third-party scripts or CDN fonts.
- **Design tokens only.** Use the colours and fonts defined on `:root` in `src/styles.css`.
- **Small dependencies.** Open an issue before adding one.

## Good first contributions

- New shrink recipes in `src/lib/shrink.ts` (with a test)
- Date words in another language in `src/lib/parse.ts`
- Copy improvements and translations
- Bug reports with the exact text you typed into the brain dump

## Commit style

Short, present tense: `Add shrink recipe for lab reports`. Reference issues with `#123`.

## Code of conduct

By taking part you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).

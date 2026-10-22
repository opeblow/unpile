# Security Policy

## How Unpile handles data

- Unpile is a static site. There is **no server, no database, no account and no analytics**.
- Tasks and settings are stored only in the browser’s `localStorage` (key `unpile:v1`) on the user’s device.
- The app makes **no network requests** after loading. Fonts are bundled, not loaded from a CDN.
- Voice input uses the browser’s built-in speech recognition. Depending on the browser, audio may be processed by the browser vendor (for example Google for Chrome). This is opt-in via the “Say it instead” button.
- Imported backup files are parsed with `JSON.parse` and passed through `sanitize()`; they are never executed. All task text is rendered by React as text, never as HTML.

## Supported versions

| Version | Supported |
| --- | --- |
| 1.x (latest `main`) | ✅ |
| older | ❌ |

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Use GitHub’s private reporting: **Security tab → Report a vulnerability** on this repository. Include steps to reproduce, the browser and version, and the impact you expect.

You can expect an acknowledgement within 72 hours and a fix or plan within 14 days. We’ll credit you in the release notes unless you prefer otherwise.

## Scope

In scope: XSS or script injection through task text, imports or URL hash; data leaking off-device; service worker cache poisoning.

Out of scope: issues that need a compromised device or browser extension; self-XSS through the browser console.

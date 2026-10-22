# Setup

Unpile is a static web app (React + TypeScript + Vite). No backend, no database, no API keys.

## Requirements

- Node.js 18 or newer (built and tested on Node 24)
- npm

## Run it locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). Click **“Try it with a sample messy list”** to see the whole flow in about 30 seconds.

## Other commands

| Command | What it does |
| --- | --- |
| `npm test` | Runs the unit tests (parser, picker, shrinker, store, share message) |
| `npm run typecheck` | Strict TypeScript check |
| `npm run build` | Type-checks and builds to `dist/` |
| `npm run preview` | Serves the production build at http://localhost:4173 |

## Deploy (pick one, all free)

The build uses relative paths, so `dist/` works from any host or sub-folder.

**GitHub Pages (automatic):** push to a GitHub repo on the `main` branch. In the repo go to **Settings → Pages → Source → GitHub Actions**. The workflow in `.github/workflows/deploy.yml` tests, builds and publishes on every push.

**Netlify Drop (fastest, 1 minute):** run `npm run build`, then drag the `dist` folder onto https://app.netlify.com/drop.

**Vercel:** import the repo; framework preset “Vite”, build command `npm run build`, output `dist`.

## Pushing to GitHub for the first time

```bash
git init
git add .
git commit -m "Unpile: one calm next step"
git branch -M main
git remote add origin https://github.com/<you>/unpile.git
git push -u origin main
```

## Browser support

Latest Chrome, Edge, Firefox and Safari, desktop and mobile. Voice input (“Say it instead”) uses the browser speech API and appears only in browsers that support it (Chrome, Edge, Safari). Everything else works everywhere, including offline after the first visit.

## Data

All data lives in the browser’s `localStorage` under the key `unpile:v1`. Use **Comfort → Download backup** to export it as JSON.

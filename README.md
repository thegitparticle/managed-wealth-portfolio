# managed-wealth-portfolio

A lightweight dashboard UI with a Cloudflare Worker API endpoint and static assets served from `public/`.

## Deployment model

This project deploys as a **Cloudflare Worker with static assets**, not as a classic Cloudflare Pages Functions project.

The deployment shape is intentionally narrow:

- `src/worker.ts` is the single Worker entrypoint.
- `public/` contains the only static files uploaded by Wrangler.
- `wrangler.jsonc` sets `assets.directory` to `./public`, preventing Wrangler from uploading the repository root or `node_modules/` as static assets.
- `assets.not_found_handling` is set to `single-page-application`, so direct browser requests for client-side routes still return `public/index.html`.
- `npm run deploy` runs `wrangler deploy`.

## Commands

```bash
npm run dev
```

Starts the local Node dev server. It serves static files from `public/` and exposes a local `/api/random` endpoint for development.

For Cloudflare, configure the build/deploy command as `npm run deploy`. Do not use `wrangler pages deploy` for this repository.

```bash
npm run preview
```

Runs the Worker locally through Wrangler.

```bash
npm run deploy
```

Deploys the Worker and `public/` static assets with Wrangler.

## Runtime random API

The Worker handles `GET /api/random` and `HEAD /api/random`, responds to CORS preflight `OPTIONS /api/random`, and returns a JSON payload with a random value and generation timestamp for GET requests.

The dashboard demonstrates both:

- A **build-time** random value generated in the client at startup (static for the session).
- A **runtime** random value fetched from the server (`/api/random`) on each page load or on demand.

## Static frontend files

The browser entrypoint is `public/index.html`. It loads the stylesheet from `/app/styles/app.css` and the JavaScript module from `/app/main.js`.

Styling includes orange/green brand tints, dark-mode support, and a compact/dense UI toggle for an industrial, information-dense look.

# RL Fishing Simulator

A single-page web simulation for an epsilon-greedy multi-armed bandit decision:
- Choose fishing location: lake or river.
- Earn reward by selling fish at market.
- Observe the agent's "Brain" and daily "Journal" notes.

## GitHub Pages setup (important)

Use **Settings → Pages → Source = GitHub Actions**.

This repo deploys `dist/` via `.github/workflows/github-pages.yml`. If Pages is set to
`Deploy from a branch` with root files, you may see 404s depending on path expectations.

## Development

```bash
npm install
npm run dev
```

## Tests

```bash
npm run test:unit
npm run test:e2e
```

## Playwright / Chromium troubleshooting

If e2e tests fail with a missing browser executable, install Playwright's Chromium bundle:

```bash
npx playwright install chromium
```

In restricted/proxied environments, browser downloads may be blocked and return `403 Forbidden`
from the proxy when accessing Playwright CDN URLs. You can quickly verify this with:

```bash
curl -I https://cdn.playwright.dev/builds/cft/145.0.7632.6/linux64/chrome-linux64.zip
```

If that request is blocked, e2e tests cannot run until network policy allows those downloads
(or a compatible Chromium binary is preinstalled in the environment).

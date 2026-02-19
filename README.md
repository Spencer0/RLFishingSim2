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

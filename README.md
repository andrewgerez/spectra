![Spectra logo](public/spectra.png)

**Spectra** is a **state-first** testing stack for **WebGL TV applications** (for example apps built with Lightning TV and Solid). Instead of driving the UI only through pixels or brittle selectors, tests query **live app state** exposed over a small bridge: current route, focus, and a serialized UI tree.

The goal is reliable end-to-end and integration tests that feel natural for **TV remote** flows while still running in **Playwright** (or other runners) when you want speed and CI.

## What you get

- **`@spectra/test-api`** — In-app `TEST_API` surface: tree serialization, focus descriptors, route tracking, splash skip hooks. Your app opts in (for example with `VITE_SPECTRA_ENABLED=true`).
- **`@spectra/bridge`** — WebSocket bridge between the runner and the browser so queries and events stay in sync with the real app.
- **`@spectra/runner`** — `SpectraTestContext`, `waitFor` / `waitForRoute` / `waitForFocus`, assertions, and a Playwright fixture that wires bridge + driver + navigation.
- **`@spectra/driver`** — Remote-control abstraction: Playwright keyboard mapping to TV keys, optional ADB / keyboard drivers for device labs.
- **`@spectra/visual`** — Snapshot-style helpers (screenshots, diff, optional OCR) for visual regression where you need it.

## Monorepo layout

| Path | Role |
|------|------|
| `packages/test-api` | Types and hooks the TV app implements |
| `packages/bridge` | Protocol + server/client WebSocket |
| `packages/runner` | Test API consumed by Playwright / Vitest |
| `packages/driver` | Input adapters |
| `packages/visual` | Image comparison utilities |
| `apps/example-tests` | Example Playwright suite against a real app |

## Running the example tests

1. Start your TV web app with Spectra instrumentation enabled (see your app’s docs; typically `VITE_SPECTRA_ENABLED=true` and the test API installed).
2. From the repo root:

```bash
npm install
npm run test:e2e        # all Playwright tests in apps/example-tests
```

Point `apps/example-tests` at your dev server URL via Playwright config / `spectraOptions.appUrl` if it is not already `http://localhost:5173`.

## Building packages

```bash
npm run build
npm run typecheck
```

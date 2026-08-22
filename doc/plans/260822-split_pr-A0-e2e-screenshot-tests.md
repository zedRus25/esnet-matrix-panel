# PR A0: e2e screenshot test coverage (do this first)

**Target repo/branch:** `esnet/esnet-matrix-panel`, based on `master` at
`6fd187f` (this plan's branch: `upstream-clean-base`).
**Depends on:** nothing. Comes first in the sequence — A1/A2/A3 (and
later phases) should each add a screenshot-backed test case to what this
PR establishes, rather than each inventing their own e2e scaffolding.
**Touches:** new `tests/` directory, no changes to `src/`.

## Why this goes first

`.github/workflows/ci.yml` already has a complete `playwright-tests` job:
it builds the plugin, starts Grafana via `docker compose up -d` against a
matrix of Grafana versions (resolved by
`grafana/plugin-actions/e2e-version`), waits for it with
`grafana/plugin-actions/wait-for-grafana`, runs `yarn e2e`, and publishes
an HTML report (traces/screenshots on failure) via
`grafana/plugin-actions/playwright-gh-pages` to GitHub Pages. `package.json`
already has the `e2e` script and `@playwright/test`/`@grafana/plugin-e2e`
devDependencies. `playwright.config.ts` at the repo root is fully wired
(a `auth` project that logs into Grafana once via `@grafana/plugin-e2e`'s
bundled auth fixture and saves `playwright/.auth/admin.json`, then a
`chromium` project that runs authenticated).

**None of this does anything today** — `playwright.config.ts` points
`testDir: './tests'`, and that directory does not exist. The CI job's own
`Check for E2E` step only flips `has-e2e=true` because
`playwright.config.ts` is present; if `tests/` had zero spec files the
`yarn e2e` step would presumably no-op or fail depending on Playwright's
"no tests found" behavior — confirm this by running `yarn e2e` locally
once specs exist.

Every later PR (A1's fit-to-panel, A2's tooltip fields, A3's bundle trim,
and especially the Phase C timeseries work) benefits from having actual
Grafana-rendered screenshots to (a) verify the change renders correctly
end-to-end, not just that unit tests pass, and (b) generate real example
images for PR descriptions and docs. Building that scaffolding once, here,
means every subsequent PR just adds one spec file to an existing pattern
instead of re-deriving it.

## What to build

1. **`tests/matrix-panel.spec.ts`** (or split into a few files as it
   grows) using `@grafana/plugin-e2e`'s fixtures. Check
   `@grafana/plugin-e2e`'s README/type definitions (once
   `yarn install` has run — `node_modules/@grafana/plugin-e2e`) for the
   exact fixture API; the general Grafana plugin-e2e pattern is:
   ```ts
   import { test, expect } from '@grafana/plugin-e2e';

   test('matrix panel renders with sample data', async ({ panelEditPage, page }) => {
     // navigate to (or create) a dashboard with a matrix panel using a
     // known dataset (CSV datasource or the provisioned test datasource
     // — check provisioning/datasources/datasources.yml for what's
     // already configured), then assert the panel rendered.
     await expect(page.locator('.matrix-panel-svg-selector-or-similar')).toBeVisible();
     await expect(page).toHaveScreenshot('matrix-panel-default.png');
   });
   ```
   The exact selectors need to be derived from the actual rendered DOM
   (`src/matrix.js` builds SVG elements with classes like
   `svg-${id}`/`matrix-panel-${id}` — inspect these once a real instance
   is running to get precise, stable selectors) rather than guessed.

2. **Provisioned test dashboard.** `provisioning/dashboards/dashboard.json`
   and `provisioning/datasources/datasources.yml` already exist — check
   whether `dashboard.json` currently contains a matrix panel with known
   options and a fixed/deterministic dataset (a CSV or testdata
   datasource is preferable to anything with real timestamps/randomness,
   for stable screenshot diffs). If it doesn't yet have a suitable panel,
   extend it with one covering the plugin's default configuration, and
   add additional provisioned panels as new option combinations are
   covered by later PRs (grouping, sort modes, etc. — coordinate with
   whichever PR adds each feature so the fixture dashboard grows
   alongside the option surface).

3. **Visual regression baselines.** Use Playwright's
   `expect(page).toHaveScreenshot(name)` (or
   `expect(locator).toHaveScreenshot(name)` scoped to just the panel
   element, which is more stable than a full-page screenshot) to
   establish baseline PNGs checked into the repo under
   `tests/matrix-panel.spec.ts-snapshots/` (Playwright's default
   location). Run once locally/in CI to generate the initial baselines,
   review them by hand, then commit them.

4. **Confirm the CI job actually runs and passes** with real specs in
   place — push a branch, open a draft PR, and check the
   `playwright-tests` job matrix (it runs once per Grafana version
   resolved by `grafana/plugin-actions/e2e-version`) goes green, and that
   the published HTML report (via `playwright-gh-pages`) actually shows
   the screenshots.

## Scope boundaries

- Keep the first PR's test coverage intentionally small: one or two specs
  covering the plugin's default render and maybe one existing option
  (e.g. category grouping, since that's already merged upstream via
  #26/#27). The goal is proving the scaffolding works end-to-end, not
  exhaustive coverage — later PRs add their own specs incrementally.
- Do not attempt to make this run outside Docker/CI in this PR. A fully
  sandboxed (non-Docker) local-dev screenshot workflow was investigated
  separately and is currently blocked by network policy (no reachable
  `grafana-server` binary download) in at least one Claude-driven dev
  environment — that's a tooling/environment problem, not something this
  PR needs to solve. This PR only needs to make the existing
  Docker-based CI path (which already works on GitHub Actions runners)
  actually exercise real tests.
- Don't restructure `playwright.config.ts` or the CI workflow itself
  unless something is actually broken once real specs exist — both
  appear complete and correct as-is; the gap is purely "no spec files."

## PR description guidance

Frame this as "wire up the e2e test infrastructure that's already fully
configured but has zero tests" — cite the existing `ci.yml` job,
`playwright.config.ts`, and `@grafana/plugin-e2e` devDependency as
evidence this isn't new infrastructure, just the missing test content.
Include a couple of the generated baseline screenshots directly in the PR
description as visual proof the harness works end-to-end.

# PR A0: e2e screenshot test coverage (do this first)

**Target repo/branch:** `esnet/esnet-matrix-panel`, based on `master` at
`6fd187f` (this plan's branch: `upstream-clean-base`).
**Depends on:** nothing. Comes first in the sequence — A1/A2/A3 (and
later phases) should each add a screenshot-backed test case to what this
PR establishes, rather than each inventing their own e2e scaffolding.
**Touches:** new `tests/` directory, one new CI job in
`.github/workflows/ci.yml`. No changes to `src/`.

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
(an `auth` project that logs into Grafana once via `@grafana/plugin-e2e`'s
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

## Design decisions (settled)

These were worked through explicitly rather than left implicit — later
PRs building on this should not silently deviate without a reason.

- **Standalone, no `src/` changes.** A0 does not bundle a feature. It's
  justified purely by "the CI pipeline already exists and runs zero
  tests" — a small, self-contained ask rather than inflating A1's review
  surface.
- **Smoke-only, not pixel-regression.** Specs assert the panel actually
  rendered (no crash, expected elements visible) and capture a
  screenshot as a CI artifact for humans to look at. They do **not** use
  `toHaveScreenshot()` pixel-diff assertions. This is not "no
  assertions" — a crash or missing element still fails CI — it's
  specifically deferring committed pixel baselines, which need
  generating/maintaining by someone with a working local Docker+Grafana
  setup. (A Claude-driven sandboxed session currently can't do this: no
  Docker daemon, and network policy blocks a standalone `grafana-server`
  binary download — see the main plan doc.) Pixel-regression can be a
  follow-up once that maintenance path is real.
- **Cover both existing provisioned panels.** `provisioning/dashboards/dashboard.json`
  already has two matrix panels — panel id `1` "Simple latency matrix"
  (default config) and panel id `2` "Grouped matrix" (grouping +
  `aggregationMethod: sum`, confirming PR #27's aggregation feature is
  already live on `master`). Both use the TestData datasource's
  `raw_frame` scenario (`provisioning/datasources/datasources.yml`,
  `uid: trlxrdZVk`), which returns a fixed, non-randomized frame — good,
  deterministic input for both panels with zero extra provisioning work.
  Cover both in the initial specs rather than just the default one.
- **Selectors: use the existing id-based DOM structure, don't add
  `data-testid`s.** `src/matrix.js` currently renders elements with
  classes like `svg-${id}`/`matrix-panel-${id}`, scoped by the
  Grafana-assigned panel id — not designed as test hooks, but usable:
  look up each provisioned panel's id from the dashboard JSON (`1` and
  `2`) and select accordingly. Keep this PR test-only; if selector
  fragility becomes a real problem once more specs exist, that's a
  small, separately-justified follow-up PR adding `data-testid`s to
  `matrix.js` — don't preemptively touch `src/` here.
- **CI runtime: no changes needed now.** The `playwright-tests` job's
  existing `timeout-minutes: 15` budget is fine for smoke-only specs
  against two panels. Flagged as a watch-item for later phases —
  Phase C's playback UI will add real interaction-heavy specs
  (play/pause/scrub) that may need more headroom.

## What to build

### 1. Smoke specs

`tests/matrix-panel.spec.ts`, using `@grafana/plugin-e2e`'s fixtures
(check `node_modules/@grafana/plugin-e2e`'s README/types once
`yarn install` has run for the exact fixture API — e.g. whether it
exposes a `dashboardPage`/`panelEditPage` fixture that can navigate
straight to the provisioned dashboard by uid, versus needing a plain
`page.goto('/d/<dashboard-uid>')`). Shape:

```ts
import { test, expect } from '@grafana/plugin-e2e';

test.describe('esnet-matrix-panel', () => {
  test('default panel renders without error', async ({ page }) => {
    // navigate to the provisioned dashboard (check its uid once
    // provisioning/dashboards/dashboard.json is loaded by a running
    // instance), then locate panel id 1 ("Simple latency matrix").
    const panel = page.locator('[class*="matrix-panel-1"]');
    await expect(panel).toBeVisible();
    await expect(panel.locator('svg')).toBeVisible();
    await panel.screenshot({ path: 'test-results/screenshots/default-panel.png' });
  });

  test('grouped/aggregated panel renders without error', async ({ page }) => {
    const panel = page.locator('[class*="matrix-panel-2"]');
    await expect(panel).toBeVisible();
    await expect(panel.locator('svg')).toBeVisible();
    await panel.screenshot({ path: 'test-results/screenshots/grouped-panel.png' });
  });
});
```

Screenshots are captured via plain `locator.screenshot()` (not
`expect(...).toHaveScreenshot()`), cropped to the panel element —
deliberately excluding Grafana chrome (top nav, time picker) that adds
noise and never changes — and written to `test-results/screenshots/` for
upload as a CI artifact, not committed to the repo as regression
baselines.

### 2. CI wiring: upload the smoke screenshots

Add an `actions/upload-artifact` step to the existing `playwright-tests`
job (after the `yarn e2e` / test-run step) uploading
`test-results/screenshots/`, so every PR run produces downloadable
images without needing a separate mechanism for that alone.

### 3. Before/after screenshot pairs (new job)

A second job, `pr-screenshot-diff`, gated to `pull_request` events only
(no reason to run it on `push` to `master` — there's no "before" to
diff against there):

1. Checkout the merge-base of the PR head and its target branch, build
   the plugin (`yarn build`), start Grafana via the same
   `docker compose up -d` pattern the main job uses, run the *same*
   `tests/matrix-panel.spec.ts` smoke specs against it (reusing them —
   no separate capture spec), and save the resulting screenshots to
   e.g. `before/`.
2. Checkout the PR head commit, repeat the same build+run+screenshot
   steps, saving to `after/`.
3. Upload both directories together as one artifact (e.g.
   `before-after-screenshots`), so a reviewer downloads a single zip and
   can flip between matching filenames.
4. Pin this job to a single Grafana version rather than the full
   version matrix the main `playwright-tests` job uses — the purpose
   here is reviewer illustration, not cross-version regression, so
   running it once (e.g. against the newest version the matrix
   resolves, or a hardcoded version matching the `@grafana/data`
   dependency's `12.4.x` line) is sufficient. Fanning this out across
   the full matrix would multiply cost for no illustrative benefit.
5. Retention: match the existing `Archive Build` step's convention
   (`retention-days: 5`) unless there's a reason to differ.

This job naturally grows in usefulness as later PRs add more specs to
`tests/` — no changes needed to the job itself, since it just re-runs
whatever specs exist against both refs.

### 4. Provisioned dashboard maintenance

As later PRs add options (grouping variants, sort modes, playback UI),
extend `provisioning/dashboards/dashboard.json` with additional panels
covering them, and add a matching spec — coordinate this per-PR rather
than trying to anticipate the full option surface here.

### 5. Confirm it actually works end-to-end

Push a branch, open a draft PR, and check: the `playwright-tests` job
matrix goes green with real assertions running (not a no-op), the smoke
screenshots upload as an artifact, and the new `pr-screenshot-diff` job
produces a downloadable before/after pair.

## Scope boundaries

- Keep initial coverage to the two existing provisioned panels — don't
  add new panel configurations in this PR just to test more; that's for
  whichever future PR introduces the option being tested.
- Do not attempt to make this run outside Docker/CI in this PR. A fully
  sandboxed (non-Docker) local-dev screenshot workflow is a separate,
  currently-blocked concern (see the main plan doc) — this PR only needs
  the existing Docker-based CI path (which already works on GitHub
  Actions runners) to actually exercise real tests.
- Don't restructure `playwright.config.ts` beyond what's needed to point
  at real specs — it already appears complete and correct.
- Don't add `toHaveScreenshot()` pixel-regression baselines in this PR
  (see "Smoke-only" above) — that's an intentional, explicit follow-up,
  not an oversight.

## PR description guidance

Frame this as "wire up the e2e test infrastructure that's already fully
configured but has zero tests" — cite the existing `ci.yml` job,
`playwright.config.ts`, and `@grafana/plugin-e2e` devDependency as
evidence this isn't new infrastructure, just the missing test content
plus one small additive job for reviewer-facing before/after images.
Include the actual before/after artifact from this PR's own CI run
(there's no "before" plugin code changing, so it'll show the same panel
twice — still useful as a demonstration that the mechanism works) as
visual proof the harness works end-to-end.

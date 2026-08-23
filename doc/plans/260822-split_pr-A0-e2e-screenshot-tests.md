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
- **Selectors: use `@grafana/plugin-e2e`'s `Panel` fixture, don't add
  `data-testid`s.** `dashboardPage.getPanelById('1' | '2')` (from the
  `gotoDashboardPage` fixture) returns a `Panel` object with a public
  `.locator` scoped to that panel — no need to hand-roll a
  `[class*="matrix-panel-1"]` selector against `src/matrix.js`'s
  `svg-${id}`/`matrix-panel-${id}` classes. `readProvisionedDashboard({
  fileName: 'dashboard.json' })` resolves the dashboard uid from
  provisioning instead of hardcoding it. Keep this PR test-only; if
  finer-grained selectors become necessary once more specs exist, that's
  a small, separately-justified follow-up PR adding `data-testid`s to
  `matrix.js` — don't preemptively touch `src/` here.
- **CI runtime: no changes needed now.** The `playwright-tests` job's
  existing `timeout-minutes: 15` budget is fine for smoke-only specs
  against two panels. Flagged as a watch-item for later phases —
  Phase C's playback UI will add real interaction-heavy specs
  (play/pause/scrub) that may need more headroom.

## What to build

### 1. Smoke specs

`tests/matrix-panel.spec.ts`, implemented using `@grafana/plugin-e2e`'s
`gotoDashboardPage`/`readProvisionedDashboard` fixtures and the `Panel`
model's `getPanelById`/`getErrorIcon`/`.locator`:

```ts
import { test, expect } from '@grafana/plugin-e2e';

test.describe('esnet-matrix-panel', () => {
  test('default panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('1');
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('svg')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/default-panel.png' });
  });

  test('grouped/aggregated panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('2');
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('svg')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/grouped-panel.png' });
  });
});
```

`readProvisionedDashboard` resolves the dashboard uid from
`provisioning/dashboards/dashboard.json` rather than hardcoding it, and
`getErrorIcon()` gives an explicit assertion against Grafana's own panel
error state (not just "some svg exists"). Screenshots are captured via
plain `locator.screenshot()` (not `expect(...).toHaveScreenshot()`),
cropped to the panel element — deliberately excluding Grafana chrome
(top nav, time picker) that adds noise and never changes — and written
to `test-results/screenshots/` for upload as a CI artifact, not
committed to the repo as regression baselines.

This has been implemented on the `upstream-clean-base` branch
(`tests/matrix-panel.spec.ts`), verified against `@grafana/plugin-e2e`
3.8.0's type definitions (the exact version pinned in `yarn.lock`) since
running the real Docker-based suite isn't possible in this sandbox (see
"Scope boundaries").

### 2. CI wiring: upload the smoke screenshots (implemented)

Added an `actions/upload-artifact` step to the existing
`playwright-tests` job, right after the `yarn e2e` step, uploading
`test-results/screenshots/` per Grafana-version matrix leg (name
suffixed with `${{ matrix.GRAFANA_IMAGE.NAME }}-${{
matrix.GRAFANA_IMAGE.VERSION }}` since the job fans out across
versions), `if: always() && !cancelled()` so a failing run still leaves
useful screenshots to inspect, and `if-no-files-found: ignore` so a
build that fails before any screenshot is written doesn't error the
upload step itself. Retention: 5 days, matching the existing `Archive
Build` step.

### 3. Before/after screenshot pairs (implemented: `pr-screenshot-diff` job)

A second job, `pr-screenshot-diff`, gated to
`github.event_name == 'pull_request'` (no reason to run it on `push` to
`master` — there's no "before" to diff against there) and to
`needs.build.outputs.has-e2e == 'true'`:

1. Checks out with `fetch-depth: 0` (needed to compute a merge-base),
   installs deps and Playwright's Chromium once.
2. Resolves `git merge-base origin/${{ github.base_ref }} HEAD` and
   checks it out, builds the plugin (`yarn build`), starts Grafana via
   the same `docker compose up -d` pattern the main job uses (pinned to
   `GRAFANA_VERSION: '12.4.0'`, matching the `docker-compose-base.yaml`
   default, rather than the full `resolve-versions` matrix — the
   purpose here is reviewer illustration, not cross-version regression,
   so running it once is sufficient and fanning out across the full
   matrix would multiply cost for no illustrative benefit), waits for
   it, runs the *same* `tests/matrix-panel.spec.ts` smoke specs
   (reusing them — no separate capture spec), and copies
   `test-results/screenshots/` into `before-after/before/`, then tears
   the container down.
3. Checks out `${{ github.sha }}` (the PR head) and repeats the same
   build+run+screenshot steps, saving into `before-after/after/`.
4. Uploads `before-after/` as one artifact (`before-after-screenshots`),
   so a reviewer downloads a single zip and can flip between matching
   filenames under `before/` and `after/`. Retention: 5 days, matching
   the existing `Archive Build` step's convention.

This job naturally grows in usefulness as later PRs add more specs to
`tests/` — no changes needed to the job itself, since it just re-runs
whatever specs exist against both refs.

### 4. Provisioned dashboard maintenance

As later PRs add options (grouping variants, sort modes, playback UI),
extend `provisioning/dashboards/dashboard.json` with additional panels
covering them, and add a matching spec — coordinate this per-PR rather
than trying to anticipate the full option surface here.

### 5. Confirm it actually works end-to-end

Push the branch and open a PR against `esnet/esnet-matrix-panel`, then
check the Actions run: the `playwright-tests` job matrix goes green with
real assertions running (not a no-op), the smoke screenshots upload as
an artifact per Grafana version, and the new `pr-screenshot-diff` job
produces a downloadable `before-after-screenshots` artifact. This step
could not be exercised in the sandboxed environment this PR was drafted
in (no Docker daemon, network policy blocks a standalone
`grafana-server` download — see the main plan doc's "local/sandboxed
screenshotting" note) — it needs a real GitHub Actions run once the PR
is open.

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

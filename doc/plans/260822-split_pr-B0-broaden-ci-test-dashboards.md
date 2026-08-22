# PR B0: broaden the CI test dashboard / e2e smoke coverage

**Target repo/branch:** `esnet/esnet-matrix-panel`, based on `master` at
`6fd187f` (this plan's branch: `upstream-clean-base`).
**Depends on:** nothing functionally, but should land after A0-A4 so it can
also cover their new options (`extraTooltipFields`, `fitToPanel`, etc.)
without a second follow-up PR. If opened before they merge, just cover
what exists today and note the gap.
**Touches:** `provisioning/dashboards/dashboard.json`, `tests/matrix-panel.spec.ts`.

## Problem

The provisioned test dashboard (`provisioning/dashboards/dashboard.json`)
has exactly **two** panels — "Simple latency matrix" and "Grouped matrix"
— and `tests/matrix-panel.spec.ts` has exactly two tests, one per panel,
each asserting only "renders without error" + a screenshot. This is the
dashboard that:

- backs every `playwright-tests` matrix job (cross Grafana-version smoke test)
- backs the `pr-screenshot-diff` before/after job that every PR's CI run produces

So in practice, **every option in `MatrixOptions` that isn't exercised by
one of these two panels currently has zero CI coverage** — a regression in
static row/column lists, the categorical legend, null-cell coloring,
data-link URLs, or (once merged) `extraTooltipFields`/`fitToPanel` would
not fail CI and would not show up in the before/after screenshot diff.
That's a real gap: it's the reason A0-A4 all had to fall back on manual
diff review instead of CI-verified behavior for some of their new options.

This is not only about covering our own A/B-series options. A full read of
`src/module.ts`/`src/types.ts` shows most of the plugin's existing,
long-standing option surface is equally uncovered today: only one sort
type (`natural-asc`) is ever exercised, row and column grouping are only
ever tested together (never independently), there's no standard-options
threshold-based coloring, no long-label truncation, and no data shape other
than TestData's `raw_frame` scenario with small positive integers. The plan
below covers both categories in the same pass, since they're fixed by the
same mechanism (add a panel + a matching spec).

## Fix

Add a handful of new panels to the test dashboard, each isolating one
option area, plus one Playwright test per panel (mirroring the existing
`default panel renders without error` / `grouped/aggregated panel renders
without error` pattern: get panel by id, assert visible, assert no error
icon, assert the `#svg-<id>` element, screenshot it).

Proposed new panels (ids continue from the existing 1, 2):

1. **Static row/column list** (`inputList: true`, `staticRows`/`staticColumns`
   set) — covers the branch in `dataParser.ts` that skips `frame.forEach`
   for heading collection entirely.
2. **Null vs. no-data** — a `raw_frame` scenario (like panel 1's) with a
   deliberately incomplete NxN (some row/col pairs missing entirely) *and*
   at least one row present with an explicit `null` value — covers the
   `colorMap`/`nullColor`/`defaultColor` distinction end-to-end.
3. **Categorical legend** (`showLegend: true`, `legendType: 'categorical'`)
   — the existing two panels both use `legendType: 'range'`; the circles
   branch in `matrix.js`'s legend code (~line 583 on) has no coverage at all.
4. **Data link URL** (`addUrl: true`, `url`/`urlVar1`/`urlVar2` set) — covers
   the `xlink:href` branch on the cell `<a>` wrapper.
5. **Row grouping only / column grouping only** — the existing "Grouped
   matrix" panel turns on `enableColGrouping` and `enableRowGrouping`
   together; add one panel with only one of the two enabled, since
   `matrix.js`'s layout math branches independently on each
   (`colCategoryHeaderHeight`/`colCategoryGap` vs.
   `rowCategoryHeaderWidth`/`rowCategoryGap`) and today they're never
   exercised in isolation.
6. **Sort type variants** — add a `sortType: 'natural-desc'` panel and a
   `sortType: 'none'` panel. Today only the migration-handler default,
   `natural-asc`, is ever exercised; `'none'` also exercises the
   `rowCategoriesMap.values()`/`colCategoriesMap.values()` push path in
   `dataParser.ts` (~lines 209-212), which the sorted branches never touch.
7. **Standard-options / threshold coloring** — every current panel relies
   on the plugin's own `nullColor`/`defaultColor` + per-value `colorMap`,
   but `module.ts` also wires up Grafana's standard `Thresholds`/`Color`
   field config (`FieldConfigProperty.Thresholds`, `preferThresholdMode:
   true`). Add a panel whose value field is configured with thresholds so
   `valueField.display!(v).color` actually resolves through threshold-driven
   colors rather than TestData's default numeric color — that whole
   integration path currently has no coverage.
8. **Long-label truncation** — a panel with at least one row/column name
   longer than `txtLength` (default 50 chars), to exercise `truncateLabel`
   in `matrix.js` (~line 622) via the screenshot diff. This is useful
   regardless of whether A4 (pixel-accurate truncation) has landed yet —
   the panel should show visibly truncated (`...`-suffixed) labels either way.
9. **Non-`raw_frame` data shape** — the existing panels all use TestData's
   `raw_frame` scenario with small, hand-authored integer frames. Add one
   panel using TestData's `csv_content` scenario (arbitrary user-authored
   CSV) with a value column containing floats and at least one negative
   value, since the numeric-display/color path has never been exercised
   with anything other than small positive integers.
10. Once A2 lands: a panel with `extraTooltipFields` set to a comma-separated
    list matching extra fields in its `raw_frame` data, to lock in the new
    tooltip rows via the before/after screenshot diff. (If A2 hasn't merged
    yet when this PR is opened, skip this one and add it as a small
    follow-up once it has — don't block B0 on A2's merge.)
11. Once A1 lands: keep the existing two panels' `gridPos` sizes but add a
    `fitToPanel: true` variant with a `gridPos.w` deliberately narrower than
    `colNames.length * cellSize` would need, to prove cells actually shrink
    instead of overflowing.

Keep each new panel's payload small (5-8 rows, matching the existing
"Simple latency matrix" panel's style) — this is smoke/screenshot coverage,
not load testing.

For each new panel, add one test to `tests/matrix-panel.spec.ts` following
the existing two tests' exact shape (same dashboard fixture via
`readProvisionedDashboard`, `getPanelById`, visibility + no-error-icon +
`#svg-<id>` assertions, screenshot to `test-results/screenshots/<name>.png`).

## Non-goals

- Don't add assertions on tooltip *content* or exact colors here — Playwright
  screenshot diffs and `toBeVisible`/error-icon checks are the right level
  for this smoke suite; pixel-level or DOM-content assertions belong in
  `dataParser.test.ts`/unit tests, not e2e.
- Don't restructure the existing two panels or renumber their ids/uids —
  only add new ones, so this PR can't regress anything already covered.
- Don't touch `playwright.config.ts` or the CI workflow — the existing
  `yarn e2e` / matrix-job / before-after-diff plumbing already picks up
  every test in `tests/matrix-panel.spec.ts` and every panel in
  `dashboard.json` automatically.

## Tests

This PR *is* the test coverage — no separate "Tests" section beyond what's
described above. Verify locally (or via CI, since this sandbox can't run
`docker compose`/Playwright) that `yarn e2e` picks up and passes all new
specs, and that the `pr-screenshot-diff` job's before/after page shows a
screenshot per new panel.

## PR description guidance

Frame this explicitly as raising the CI safety net, not changing panel
behavior — zero production code touched, only `provisioning/dashboards/dashboard.json`
and `tests/matrix-panel.spec.ts`. Mention which option areas were
previously uncovered (static lists, categorical legend, null/no-data,
data links, independent row/col grouping, sort-type variants, threshold
coloring, long-label truncation, non-integer/negative data) so reviewers
understand why each new panel exists.

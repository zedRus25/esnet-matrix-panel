# PR B4: ARIA labels, keyboard navigation, and an accessible table view

**Target repo/branch:** `esnet/esnet-matrix-panel`, based on `master`
(this plan's branch: `upstream-clean-base`).
**Depends on:** nothing (can reuse B2's row/col label lookup maps if B2
lands first, but doesn't require it — see "Fix").
**Touches:** `src/matrix.js`, `src/types.ts`, `src/module.ts`,
`src/EsnetMatrix.tsx`.

## Problem

The matrix is rendered entirely as an SVG (`src/matrix.js`) with `<rect>`
cells and `<text>` labels — there are no `role`/`aria-label` attributes
anywhere in the file, no keyboard focus targets on cells (mouse-only
`mouseover`/`mousemove`/`mouseout`/`click` handlers), and no alternative
way to consume the data for a screen-reader user or anyone navigating by
keyboard. This is a real accessibility gap for a data-visualization panel
type that Grafana ships broadly.

## Fix

Split into two independently useful, both opt-in pieces so review stays
small and either can land without the other:

### 4a. SVG semantics + keyboard navigation (default-on, additive only)

Since these are purely additive attributes/handlers with no visual or
behavioral change for mouse users, this part can default to enabled
(unlike B1-B3/B5, which change appearance or need config) — confirm this
call with a maintainer during review; fall back to an opt-in toggle if
they'd rather be conservative.

1. Add `role="img"` and a computed `aria-label` (e.g. `"{rows} by {cols}
   matrix"`) to the root `<svg>`.
2. Add `role="button"` (or `"gridcell"` if wrapping the whole thing in
   `role="grid"`/`role="row"` per cell-row groups — evaluate which fits
   the existing `<g>` structure better once implementing) and a per-cell
   `aria-label` (reusing the same row/col/value text already built for the
   tooltip) to every cell `<rect>`/wrapping `<a>`.
3. Add `tabindex="-1"` to all cells except one "roving" cell per matrix
   (`tabindex="0"`), and wire arrow-key handlers (`keydown` on the SVG
   root) that move the roving tabindex up/down/left/right by one
   row/column, calling `.focus()` on the newly-active cell. Enter/Space
   triggers the same action as a click (pinning the tooltip / following
   the data link if `addUrl` is set); Escape blurs/resets.
4. If B2 has landed, reuse its row/col label lookup Maps to also drive the
   cross-highlight on keyboard focus, not just mouse hover — otherwise,
   skip that reuse and just implement plain focus-ring styling on the
   active cell (a visible `outline` via `:focus` — SVG focus rings need an
   explicit style since browsers render them inconsistently on SVG shapes).

### 4b. Accessible table view (opt-in toggle)

Add a boolean option, `accessibleTableView` (default `false`). When
enabled, `EsnetMatrix.tsx` renders a visually-hidden (`sr-only`-style, not
`display: none` — needs to stay in the accessibility tree) native HTML
`<table>` alongside the SVG, built directly from `parsedData` (`rowNames`
× `colNames` × `data[r][c].display.text`), with real `<th scope="row">`/
`<th scope="col">` headers. This gives screen-reader users a fully native,
already-accessible way to consume the same data without relying on the
custom ARIA semantics in 4a to be perfectly correct in every screen
reader.

## Tests

- Unit: a small DOM/jsdom-based test asserting the roving-tabindex
  attribute moves correctly on simulated arrow-key `keydown` events (one
  cell has `tabindex="0"`, rest `"-1"`, and it shifts one row/column per
  key press, clamped at matrix edges).
- Unit: with `accessibleTableView: true`, assert the rendered `<table>`
  has the expected number of rows/columns and that cell text matches
  `parsedData`.
- e2e: add a panel to the CI test dashboard (per B0) and a Playwright test
  that tabs into the matrix, presses arrow keys, and asserts focus moved
  (via `page.locator(...):focus` or an `aria-activedescendant`-style
  check, depending on final implementation approach).

## PR description guidance

Split the PR body into the same two pieces as this plan (4a "always-on,
purely additive" vs. 4b "opt-in accessible table"), since a reviewer may
have opinions on defaulting 4a on that don't apply to 4b. Note this is the
one item in the B-series where "default on" is being proposed rather than
opt-in, specifically because it adds no visible behavior change for
existing mouse-only users — flag that explicitly for reviewer sign-off
rather than asserting it unilaterally.

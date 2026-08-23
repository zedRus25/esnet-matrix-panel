# PR B2: hover cross-highlight for row/column labels

**Target repo/branch:** `esnet/esnet-matrix-panel`, based on `master`
(this plan's branch: `upstream-clean-base`).
**Depends on:** nothing.
**Touches:** `src/matrix.js`, `src/types.ts`, `src/module.ts` (one new
opt-in toggle).

## Problem

Hovering a cell today only shows a tooltip (`src/matrix.js`'s
`.on('mouseover', ...)` handler, ~lines 453-507) — there's no visual cue
tying the hovered cell back to its row/column labels, and no way to tell at
a glance which other cells share that row or column once a matrix gets
larger than a handful of rows/columns. Row and column labels are created in
two separate loops (`columnPositions.forEach`/`rowPositions.forEach`,
~lines 193-260), each with their own independent `mouseover`/`mousemove`/
`mouseout` handlers — there is currently no name-indexed lookup from a row
or column name to its label's DOM/d3 selection, so nothing in the codebase
can currently reach "the column label for this cell" from a cell's own
mouseover handler.

## Fix

Add an opt-in boolean, `hoverCrossHighlight` (default `false`, preserving
current behavior). When enabled:

1. While building the row/column label loops, populate two `Map<string,
   d3.Selection>` instances (`rowLabelByName`, `colLabelByName`) keyed by
   label text, mirroring the existing `outer` Map pattern already used
   elsewhere in this file for row-index tracking. This is the only
   structural addition — everything else is behavior wired off it.
2. In the cell `<rect>`'s existing `mouseover` handler, when
   `options.hoverCrossHighlight` is true:
   - Select all cells (`d3.selectAll('.cell')` or equivalent existing
     class hook) and apply a dimmed opacity to every cell that isn't in
     the hovered cell's row or column.
   - Look up `rowLabelByName.get(d.row)` / `colLabelByName.get(d.col)` and
     apply a bold/emphasized style (e.g. `font-weight: 700` or a color
     shift) to just those two labels.
3. In the matching `mouseout` handler, reset both the cell opacities and
   the two label styles back to their normal state.

Keep the dimming/highlight purely presentational (opacity + font-weight),
not a DOM restructuring — so it composes cleanly with existing
grouping/legend/tooltip code without touching their logic.

Add the field to `MatrixOptions` in `src/types.ts` and a corresponding
`addBooleanSwitch` in `src/module.ts`, defaulted to `false`.

## Tests

- No `dataParser.ts` changes — this is pure rendering behavior, so no unit
  test changes needed there.
- e2e: add a panel with `hoverCrossHighlight: true` to the CI test
  dashboard (per B0), plus a Playwright test that hovers a known cell and
  asserts (via computed style or a class toggle) that the matching row/col
  labels gained the highlight state and at least one off-row/off-column
  cell's opacity dropped. If B0 hasn't merged first, add a minimal
  standalone panel + test for this PR alone.

## PR description guidance

Frame as an opt-in reading aid for larger matrices, where finding "everything
in this row/column" by eye becomes hard past a dozen or so rows/columns.
Default `false` — zero behavior change for existing dashboards. Note the
one structural addition (name-indexed label lookup maps) is intentionally
generic enough that a later PR could reuse it (e.g. for keyboard navigation
in B4) without needing to duplicate the lookup.

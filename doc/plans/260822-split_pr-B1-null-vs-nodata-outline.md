# PR B1: visually distinguish "no data" cells from explicit null cells

**Target repo/branch:** `esnet/esnet-matrix-panel`, based on `master`
(this plan's branch: `upstream-clean-base`).
**Depends on:** nothing.
**Touches:** `src/matrix.js` (cell `<rect>` render/attr logic), `src/types.ts`,
`src/module.ts` (one new opt-in toggle).

## Problem

`dataParser.ts` already distinguishes two different "nothing to show" cases
structurally:

- A cell whose row/col pair never appeared in the source data at all is left
  as the literal number `-1` (`dataMatrix[i].fill(-1)` in `dataParser.ts:218`,
  never overwritten since the `frame.forEach` loop only assigns cells where
  `r > -1 && c > -1`). Its `colorMap` resolution (`dataParser.ts:86-94`)
  falls through to `defaultColor` for these because `v === -1` is checked
  explicitly.
- A cell whose value is an explicit `null` gets a real `DataMatrixCell`
  object with `color: colorMap(null) = nullColor` (`dataParser.ts:87-88`).

So the two cases are NOT conflated in the data model. The problem is purely
visual: `nullColor` and `defaultColor` both default to the same swatch
(`#E6E6E6`), and nothing in `matrix.js`'s cell-rendering code
(`src/matrix.js` ~line 400-451, where the `<rect fill="...">` is set from
`d.color ?? defaultColor`) renders any other distinguishing attribute. So
with default settings, a "we have no data for this pair" cell and a "we
explicitly recorded null for this pair" cell are pixel-identical, even
though a dashboard author might want them to read differently (e.g. "not
measured" vs. "measured error/N-A").

## Fix

Add an opt-in boolean option, e.g. `outlineNoDataCells` (default `false`,
preserving current behavior), under a new or existing "Cells" options
category in `src/module.ts`.

In `src/matrix.js`'s cell-rendering loop, detect the no-data case the same
way `colorMap` does today — `d === -1` (the raw matrix entry, not an object)
— and when `options.outlineNoDataCells` is true, add a `stroke`/`stroke-width`
(hairline, e.g. `1px` dashed or solid in a neutral gray) to that cell's
`<rect>` instead of (or in addition to) the fill. Explicit-null cells
(`DataMatrixCell` objects with `val === null`) are untouched by this new
attribute — they keep using `nullColor` as today.

Sketch (near the existing fill logic around `src/matrix.js:445-451`):

```js
.attr('fill', d => (d === -1 ? defaultColor : d.color))
.attr('stroke', d => (options.outlineNoDataCells && d === -1) ? '#999999' : 'none')
.attr('stroke-width', d => (options.outlineNoDataCells && d === -1) ? 1 : 0)
```

(Exact attribute names/selectors to be confirmed against the live code at
implementation time — this sketch captures the condition and intent, not a
verbatim patch.)

Add the corresponding field to `MatrixOptions` in `src/types.ts` and a
`addBooleanSwitch` entry in `src/module.ts`'s panel options builder, defaulted
to `false`.

## Tests

- `dataParser.test.ts`: no changes needed — this PR doesn't touch data
  parsing, only rendering, and the `-1` vs. `null` distinction already has
  implicit coverage via existing color-map tests (add one only if none exists
  today asserting `colorMap(-1) !== undefined`/`defaultColor`).
- e2e: extend the "Null vs. no-data" panel from PR B0 (or add one if B0
  hasn't landed yet) with `outlineNoDataCells: true`, and let the
  before/after screenshot diff lock in the new stroke visually. If B0 hasn't
  merged, add a minimal standalone panel + test for this PR alone rather
  than blocking on B0.

## PR description guidance

Frame as a small opt-in visual affordance, not a data-model change — the
underlying null-vs-missing distinction already exists in `dataParser.ts`;
this only makes it visible by default option-in. Default is `false`
(no behavior change) to stay consistent with every other PR in this series.

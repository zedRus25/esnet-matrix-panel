# PR A1: fit-to-panel-width option

**Target repo/branch:** `esnet/esnet-matrix-panel`, based on `master` at
`6fd187f` (this plan's branch: `upstream-clean-base`).
**Depends on:** nothing. Independent of PR #48.
**Touches:** `src/types.ts`, `src/module.ts`, `src/EsnetMatrix.tsx`, `src/matrix.js`.

## Problem

The matrix's rendered size is computed purely from `options.cellSize` and
the number of rows/columns — see `src/matrix.js`:

```js
totalWidth = colNames.length * cellSize;   // line ~108
totalHeight = rowNames.length * cellSize;  // line ~153
width = totalWidth, height = totalHeight;  // line ~158-159
```

The panel's actual available width (`width`/`height` props passed into
`EsnetMatrix.tsx` from Grafana's `PanelProps`) is received but never
forwarded into `Matrix.matrix(...)`:

```tsx
// src/EsnetMatrix.tsx
export const EsnetMatrix: React.FC<Props> = ({ options, data, width, height, id }) => {
  ...
  const ref = Matrix.matrix(
    parsedData.rowNames,
    parsedData.colNames,
    parsedData.data,
    id,
    options,
    parsedData.legend,
    parsedData.colCategories,
    parsedData.rowCategories,
  );
```

So when `rowNames.length * cellSize` (or the column equivalent) exceeds
the panel's actual width, the matrix simply overflows — the panel relies
on `CustomScrollbar` to let the user scroll to see it, with no way to
instead shrink cells to fit.

## Fix

Add a boolean option, `fitToPanel` (default `false`, preserving current
behavior), that scales `cellSize` down — never up — so the matrix's
natural width fits within the panel's available width.

1. **`src/types.ts`** — add `fitToPanel: boolean;` to `MatrixOptions`.

2. **`src/module.ts`** — add a `addBooleanSwitch` entry near the other
   sizing options (`cellSize`, `cellPadding` — see the `addNumberInput`
   calls around lines 144–214):
   ```ts
   builder.addBooleanSwitch({
     path: 'fitToPanel',
     name: 'Fit to panel width',
     description: 'Scale cells down (never up) so the matrix fits the panel width',
     defaultValue: false,
   });
   ```

3. **`src/EsnetMatrix.tsx`** — pass `width` (the panel's measured width,
   already destructured from props) into `Matrix.matrix(...)` as an
   additional argument.

4. **`src/matrix.js`** — accept the panel width as a new parameter to
   `matrix(...)`. Before computing `totalWidth`/`totalHeight`, if
   `options.fitToPanel` is true and the *natural* total width (using the
   configured `cellSize`) exceeds the panel width, compute an effective
   cell size:
   ```js
   let effectiveCellSize = cellSize;
   if (options.fitToPanel && panelWidth) {
     const naturalWidth = colNames.length * cellSize;
     if (naturalWidth > panelWidth) {
       effectiveCellSize = panelWidth / colNames.length;
     }
   }
   ```
   Use `effectiveCellSize` everywhere `cellSize` currently drives layout
   math (the `x.bandwidth`/`y.bandwidth` functions at lines ~188 and
   ~229, and every `groupWidth`/`groupHeight`/`x`/`y`/`width`/`height`
   computation that currently reads `cellSize` directly). Do not change
   `options.cellSize` itself — keep the user's configured value as the
   "natural" size and only apply the effective (scaled) size for layout.
   Never scale *up* — if `naturalWidth <= panelWidth`, `effectiveCellSize`
   stays equal to `cellSize`.
   Row scaling (height) should follow the same rule independently, since
   a panel can be width-constrained but not height-constrained (height
   already scrolls via `CustomScrollbar`, so height fitting is optional —
   confirm with a maintainer whether height should also be included, but
   default to width-only if unsure, since that's the actually-reported
   overflow problem).

5. Font sizes (`txtSize`) and category header heights are currently
   independent of `cellSize` (see `x.attr('font-size', txtSize + 'em')`
   pattern) — do not attempt to scale those in this PR; fitting text
   inside shrunk cells gracefully is a separate, harder problem
   (truncation already exists via `truncateLabel`) and out of scope here.

## Tests

Add to `src/module.test.ts` (or a new `src/matrix.test.ts` if one doesn't
already cover `matrix.js`):
- Given a panel width smaller than `colNames.length * cellSize` and
  `fitToPanel: true`, assert the rendered SVG's computed width is `<=`
  the panel width (within rounding).
- Given `fitToPanel: false` (default), assert behavior is byte-identical
  to current output — the SVG width should still overflow the panel
  exactly as today.
- Given a panel width *larger* than the natural matrix width and
  `fitToPanel: true`, assert cell size is unchanged (never scales up).

## PR description guidance

Explain the problem (no way to keep a large matrix inside a fixed panel
width without scrolling), the opt-in nature of the fix (`fitToPanel`
defaults to `false`, zero behavior change for existing dashboards), and
link back to this being extracted from a downstream fork's field
experience. Keep the diff minimal — this should not touch color, sort,
grouping, or legend code at all.

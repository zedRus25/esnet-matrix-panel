# PR B5: guided empty-state and parse-failure messaging

**Target repo/branch:** `esnet/esnet-matrix-panel`, based on `master`
(this plan's branch: `upstream-clean-base`).
**Depends on:** nothing.
**Touches:** `src/dataParser.ts`, `src/types.ts`, `src/EsnetMatrix.tsx`.

## Problem

`dataParser.ts` has five separate early-return "bail" points, all
collapsing to the same generic result shape (`{ rowNames: null, colNames:
null, ..., data: null, legend: null }`, or `data: 'too many inputs'`), each
just `console.error`-ing a bare string server-side:

- no `data.series[0]` at all (~line 18-22)
- `frame` construction failed (~line 25-29, effectively unreachable in
  practice since `DataFrameView` doesn't return null/undefined, but still
  present)
- `sourceKey`/`targetKey`/`valueField`/`valKey` all resolve to `undefined`
  — i.e. no usable source/target/value field mapping found (~line 73-80)
- `rowNamesSet`/`colNamesSet` both empty after collection (~line 161-165)
- more than 50,000 cells (~line 167-170, the one case with a distinct
  string sentinel, `'too many inputs'`)

`EsnetMatrix.tsx` then renders exactly one of two bare messages for all of
these: `<div>No data</div>` for every `null`-shaped bail, or `<div>Too many
data points! Try adding limits to your query.</div>` for the sentinel
case, plus a generic `<div>Unknown error: {parsedData.data}</div>` fallback
that's currently dead code (nothing else ever sets `data` to a string).
A dashboard author staring at "No data" has no way to tell whether the
query genuinely returned nothing, or whether they just haven't mapped the
Rows/Columns/Value fields yet, or whether their source/target fields
aren't strings, or whether their value field isn't numeric — all of these
currently look identical.

## Fix

Replace the single null-shaped bail result with a small discriminated
reason so the UI can give contextual guidance, without changing anything
about *when* the panel is considered "empty" (five whens above stay
exactly the same; this PR only makes their why visible).

1. **`src/types.ts`** — add a `reason` field to `MatrixData`:
   ```ts
   export type MatrixData = {
     // ...existing fields...
     reason?: 'no-series' | 'no-field-mapping' | 'no-rows-or-cols' | 'too-many-cells';
   };
   ```

2. **`src/dataParser.ts`** — at each existing bail point, set the matching
   `reason` instead of (or alongside) the current `console.error` call.
   No change to the conditions that trigger each bail — purely labeling
   the existing branches.

3. **`src/EsnetMatrix.tsx`** — replace the bare `<div>No data</div>` /
   `<div>Too many data points...</div>` messages with a small
   `reason`-keyed message map, e.g.:
   - `no-series` → "No data returned by the query. Check the panel's data
     source and query."
   - `no-field-mapping` → "Couldn't find Rows, Columns, or Value fields in
     the query result. Map them under Row/Column Options, or add a string
     field for Rows/Columns and a numeric field for Value."
   - `no-rows-or-cols` → "The query returned data, but no row or column
     headings could be built from it. Check the Rows/Columns field
     mapping."
   - `too-many-cells` → keep the existing "Too many data points! Try
     adding limits to your query." text unchanged.
   - no `reason` (shouldn't happen once all bail points are covered, but
     keep a generic "No data" fallback for safety).

Keep every message text-only, no new dependencies, no layout/styling
system beyond what `<div>` already uses today — this is a wording/branching
change, not a redesign of the empty state's presentation.

## Tests

- `dataParser.test.ts`: one test per bail point, asserting the correct
  `reason` is set for each triggering condition (no series; series present
  but no string/number fields matching source/target/value; empty
  row/col sets; `numSquaresInMatrix > 50000`).
- `dataParser.test.ts`: assert normal (non-bail) parses still return no
  `reason` field (or `reason: undefined`), confirming zero behavior change
  for the working case.
- Component test (if `EsnetMatrix.tsx` has any, or add a minimal one):
  each `reason` value renders its corresponding guidance text.

## PR description guidance

Frame as improving diagnosability for dashboard authors setting up the
panel for the first time — the current "No data" message is indistinguishable
between "your query is genuinely empty" and "you haven't mapped fields
yet," which is a common first-use stumbling block. No behavior change to
when the panel is considered empty, only to what it tells the user about
why.

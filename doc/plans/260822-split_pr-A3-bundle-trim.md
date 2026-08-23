# PR A3: drop vendored d3.min.js, use tree-shaken d3 submodules

**Target repo/branch:** `esnet/esnet-matrix-panel`, based on `master` at
`6fd187f` (this plan's branch: `upstream-clean-base`).
**Depends on:** nothing. Independent of PR #48 and of A1/A2.
**Priority:** lowest of the three Phase-A items — optional, defer or skip
if maintainer review bandwidth is tight. Pure mechanical cleanup, no
behavior change.
**Touches:** `src/matrix.js`, `package.json`, deletes `src/d3.min.js`.

## Problem

`src/matrix.js` imports a vendored, minified copy of the *entire* d3
library:

```js
import * as d3 from './d3.min.js';
```

`src/d3.min.js` is a ~280 KB blob checked directly into the repository.
Only a small subset of d3's API is actually used — from a scan of
`src/matrix.js`, the calls are limited to `d3.local()`, `d3.select(...)`,
and (implicitly, via existing `d3-scale`/`d3-scale`-adjacent usage
elsewhere) scale/axis helpers. `package.json` already lists both the
full `d3` package (`"d3": "^7.9.0"`) *and* `"d3-scale": "^4.0.2"`
separately — i.e. the dependency surface is already inconsistent between
"vendor the whole thing" and "depend on submodules."

## Fix

1. Grep `src/matrix.js` (and any other file importing from `./d3.min.js`
   or the `d3` package) for every `d3.<x>` usage to build the exact list
   of submodules needed. Expect at minimum:
   - `d3-selection` (`select`, `local`, `selectAll`, event handling used
     throughout the mouseover/mousemove/mouseout/click handlers)
   - `d3-scale` (already a separate dependency — check if `matrix.js`
     actually uses a d3 scale function directly, e.g. for the legend
     gradient, or if scaling is hand-rolled via `cellSize` math)
   - `d3-transition` (`.transition().duration(...)` calls in the tooltip
     show/hide logic)
   - `d3-axis` if any axis-generator calls exist (check `matrix.js` for
     `d3.axisBottom`/`d3.axisLeft` or hand-rolled axis rendering — this
     codebase appears to hand-roll axis labels via `text`/`rotate`
     transforms rather than using `d3-axis`, so this may not be needed;
     confirm before adding the dependency)
2. Replace `import * as d3 from './d3.min.js'` with named imports from
   the specific submodules, e.g.:
   ```js
   import { select, local } from 'd3-selection';
   ```
   and update every `d3.select(...)` / `d3.local()` call site to the
   bare `select(...)` / `local()` form (same pattern already used in this
   fork's sibling `tooltip.ts`-style code, if present, or just a
   straightforward find/replace since the API surface is unchanged).
3. Delete `src/d3.min.js`.
4. Update `package.json`:
   - Remove the blanket `"d3": "^7.9.0"` dependency.
   - Add explicit deps for exactly the submodules used (likely
     `d3-selection`, `d3-transition`, possibly `d3-scale` if not already
     sufficient as-is, `@types/d3-selection`, `@types/d3-transition` as
     devDependencies for TS type-checking, matching the existing
     `@types/d3-scale` pattern already in `package.json`).
5. Run `yarn build` (or the repo's actual build script) and manually
   verify the panel still renders correctly — this is a pure
   import-mechanism change, not a logic change, so behavior must be
   pixel-identical.

## Tests

No new test *behavior* to add (this changes imports, not logic) — but
run the full existing jest suite (`yarn test:ci`) and confirm it still
passes unmodified. If `module.test.ts` or similar snapshot-tests any
rendered output, confirm snapshots are unaffected.

## PR description guidance

Frame as a bundle-size cleanup: replacing a ~280 KB vendored blob (plus
the inconsistency of also depending on `d3-scale` directly) with the
specific tree-shaken submodules actually used, matching how the rest of
`package.json` already depends on d3 (i.e. `d3-scale` alone, not the
umbrella `d3` package). Call out that this is a zero-behavior-change,
import-only PR — safe to review quickly. Note in the PR body that this
does not touch the build system (webpack handles ES module tree-shaking
already; no webpack config changes needed).

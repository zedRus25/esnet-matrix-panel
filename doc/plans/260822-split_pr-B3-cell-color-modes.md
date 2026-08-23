# PR B3: opt-in sequential/diverging cell color modes

**Target repo/branch:** `esnet/esnet-matrix-panel`, based on `master`
(this plan's branch: `upstream-clean-base`).
**Depends on:** nothing.
**Touches:** `src/types.ts`, `src/module.ts`, `src/dataParser.ts`.

## Problem

Cell coloring today comes entirely from Grafana's standard field-config
color/threshold machinery: `colorMap(v)` in `dataParser.ts` (~lines 86-94)
resolves to `valueField.display!(v).color` for any non-null, non-missing
value — i.e. whatever the dashboard author configured under the panel's
standard "Color" options (single color, or threshold-based, per
`module.ts`'s `FieldConfigProperty.Color`/`Thresholds` wiring). There is no
built-in way to get a d3-style continuous sequential or diverging color
scale (e.g. viridis-like low-to-high, or a red-white-blue diverging scale
centered on zero) without a dashboard author hand-configuring many
threshold steps.

Upstream PR #48 added this as a set of new default color presets — but it
changed the *default* rendering behavior for existing dashboards, which is
not a pattern we want to repeat (every other PR in this series is
opt-in/zero-behavior-change by default).

## Fix

Add a `Cell Color Mode` select option, `cellColorMode` (values `standard`
[default] / `sequential` / `diverging`), defaulting to `standard` — meaning
`colorMap` behaves exactly as it does today unless a dashboard author
explicitly switches modes.

1. **`src/types.ts`** — add `cellColorMode: string;` to `MatrixOptions`,
   plus two new numeric fields, `colorScaleMin`/`colorScaleMax`, used only
   by the new modes (auto-computed from data if left blank — see below).

2. **`src/module.ts`** — add near the existing `nullColor`/`defaultColor`
   pickers:
   ```ts
   builder.addSelect({
     path: 'cellColorMode',
     name: 'Cell Color Mode',
     description: 'How cell values map to color. "Standard Options" uses the panel\'s Color/Thresholds config (current default behavior).',
     category: OptionsCategory,
     defaultValue: 'standard',
     settings: {
       allowCustomValue: false,
       options: [
         { value: 'standard', label: 'Standard Options' },
         { value: 'sequential', label: 'Sequential' },
         { value: 'diverging', label: 'Diverging' },
       ],
     },
   });
   ```
   `colorScaleMin`/`colorScaleMax` number inputs, `showIf` gated on
   `cellColorMode !== 'standard'`, with `placeholder: 'Auto'` (blank means
   compute from the actual min/max value in the current data).

3. **`src/dataParser.ts`** — in `colorMap`, branch on
   `options.cellColorMode`:
   ```ts
   function colorMap(v: any): string {
     if (v === null) { return nullColor; }
     if (v === -1) { return defaultColor; }
     if (options.cellColorMode === 'sequential') {
       return sequentialScale(v);
     }
     if (options.cellColorMode === 'diverging') {
       return divergingScale(v);
     }
     return valueField!.display!(v).color!;
   }
   ```
   `sequentialScale`/`divergingScale` built once per `parseData` call using
   `d3-scale-chromatic`'s `interpolateViridis`/`interpolateRdBu` (new
   dependency — check bundle-size impact; these are small, tree-shakeable
   submodules, consistent with A3's cleanup direction) via
   `d3.scaleSequential`, with the domain taken from
   `colorScaleMin`/`colorScaleMax` if set, else computed from
   `Math.min(...)`/`Math.max(...)` over all non-null, non-missing values
   already being collected for the legend's `range` branch (~line 252-254)
   — reuse that pass rather than re-scanning the frame.

## Tests

- `dataParser.test.ts`: `cellColorMode: 'standard'` (default) → `colorMap`
  output identical to today's behavior (no regression).
- `cellColorMode: 'sequential'` with a known min/max → assert the color at
  the min value and max value match the expected ends of the interpolator,
  and a midpoint value falls between them.
- `cellColorMode: 'diverging'` → same shape, centered check around zero
  (or `(min+max)/2` if `colorScaleMin`/`Max` aren't both zero-symmetric).
- Explicit `colorScaleMin`/`colorScaleMax` override the auto-computed
  domain — assert a value outside the natural data range still clamps
  correctly.

## PR description guidance

Frame as an opt-in alternative to hand-configuring many threshold steps for
continuous data. Emphasize `standard` is the default and reproduces
existing behavior byte-for-byte — unlike the upstream makeover PR, this
does not change what any existing dashboard looks like unless a dashboard
author explicitly opts in.

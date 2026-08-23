# PR A2: extra tooltip fields option

**Target repo/branch:** `esnet/esnet-matrix-panel`, based on `master` at
`6fd187f` (this plan's branch: `upstream-clean-base`).
**Depends on:** nothing. Independent of PR #48. Can be developed in
parallel with A1/A3 (different code regions), but should be opened as its
own PR.
**Touches:** `src/types.ts`, `src/module.ts`, `src/dataParser.ts`,
`src/matrix.js`.

## Problem

The cell tooltip (built in `src/matrix.js`, in the `.on('mouseover', ...)`
handler around lines 462–489) always shows exactly three rows: source,
target, value:

```js
tooltip.html(() => {
  const thisRow = sanitizeHtml(d.row);
  const thisColumn = sanitizeHtml(d.col);
  const thisText = sanitizeHtml(d.display.text);
  const thisSuffix = sanitizeHtml(d.display.suffix);
  const text = `<div class="${styles.tooltipTable}">
    ...three fixed rows using srcText/targetText/valText labels...
  </div>`;
  return text;
});
```

There's no way to surface additional per-row fields from the source
`DataFrame` (e.g. a status code, a region, a secondary metric) without
them appearing as separate matrix panels.

Note: sanitization already goes through `textUtil.sanitize` (imported at
the top of `src/matrix.js` as `sanitizeHtml`, from `@grafana/data`) — this
is already the modern approach, no sanitize-html migration needed here.

## Fix

Add a string option, `extraTooltipFields` (default `''`, empty = no
change in behavior), holding a comma-separated list of field names.
Resolve those fields per data row at parse time and carry them through to
the tooltip.

1. **`src/types.ts`**:
   - Add `extraTooltipFields: string;` to `MatrixOptions`.
   - Add `extra?: Record<string, string>;` to `DataMatrixCell`.

2. **`src/module.ts`** — add near the existing `sourceText`/`targetText`/
   `valueText` text inputs (lines ~234–258):
   ```ts
   builder.addTextInput({
     path: 'extraTooltipFields',
     name: 'Extra tooltip fields',
     description: 'Comma-separated field names to show as additional tooltip rows',
     defaultValue: '',
   });
   ```

3. **`src/dataParser.ts`** — near where `dataMatrix[r][c]` is populated
   (around line 228, inside the `frame.forEach((row) => {...})` loop):
   - Before the loop, parse `options.extraTooltipFields` into a trimmed,
     non-empty list of field names once.
   - Inside the loop, if the list is non-empty, build
     `extra: Object.fromEntries(fieldNames.map(name => [name, String(row[name] ?? '')]))`
     and attach it to the `DataMatrixCell` being constructed.
   - Fields that don't exist on the frame should resolve to an empty
     string rather than throwing (`row[name]` will already be
     `undefined` in that case — guard with `?? ''` as above).

4. **`src/matrix.js`** — in the tooltip builder, after the existing three
   fixed rows, append one `tooltipTable` cell pair per entry in `d.extra`
   (if present and non-empty), reusing the existing `styles.tooltipTable`/
   `tooltipTableCell`/`tooltipTableRowLabel`/`tooltipTableRowValue`
   classes for visual consistency. Sanitize both the field name (label)
   and its value with the same `sanitizeHtml` already imported in this
   file — the field name comes from a user-supplied option, but the value
   comes from data and must not be trusted.

## Tests

- `dataParser.ts`: given `extraTooltipFields: 'status,region'` and a
  frame containing those fields, assert `dataMatrix[r][c].extra` contains
  both keys with correct stringified values.
- `dataParser.ts`: given `extraTooltipFields: ''` (default), assert
  `extra` is `undefined` (no behavior change, no wasted work).
- `dataParser.ts`: given a field name in the list that doesn't exist on
  the frame, assert it resolves to `''` rather than throwing.
- If there's an existing `matrix.test.ts` / `module.test.ts` covering
  tooltip HTML generation, add a case asserting the extra rows appear
  with sanitized content when `d.extra` is populated, and don't appear
  when it isn't.

## PR description guidance

Frame this as extending the existing tooltip mechanism (which already
supports customizing the source/target/value labels via `sourceText`/
`targetText`/`valueText`) with the ability to show *additional* data
fields, for dashboards where a secondary field (status, region, owning
team, etc.) is useful context but doesn't warrant its own panel. Emphasize
the opt-in default (empty string = zero behavior change) and that both
label and value go through the same sanitization path as existing
tooltip content.

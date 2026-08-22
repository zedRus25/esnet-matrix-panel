import * as d3 from './d3.min.js';
import { truncateLabel } from './matrix';

/**
 * jsdom doesn't implement SVGTextContentElement.getComputedTextLength, so each
 * test stubs it with a deterministic "pixels per character" function instead
 * of a real font metric -- what matters here is that truncateLabel binary
 * searches correctly against whatever getComputedTextLength reports, not the
 * real value of any particular font.
 */
function makeLabel(text, pxPerChar) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  node.textContent = text;
  node.getComputedTextLength = function () {
    return node.textContent.length * pxPerChar;
  };
  svg.appendChild(node);
  return d3.select(node);
}

describe('truncateLabel', () => {
  it('leaves a label untouched when it already fits the budget', () => {
    const label = makeLabel('short', 6);
    truncateLabel(label, 100);
    expect(label.text()).toBe('short');
  });

  it('truncates to the longest prefix (plus ellipsis) that fits the pixel budget', () => {
    // 'abcdefghij' at 6px/char = 60px full width; budget 30px.
    const label = makeLabel('abcdefghij', 6);
    truncateLabel(label, 30);
    // Each candidate prefix is measured as (prefixLen + 3 for '...') * 6.
    // Largest prefixLen with (prefixLen + 3) * 6 <= 30 is prefixLen = 2.
    expect(label.text()).toBe('ab...');
  });

  it('falls back to a bare ellipsis when even one character does not fit', () => {
    const label = makeLabel('abcdefghij', 6);
    truncateLabel(label, 5);
    expect(label.text()).toBe('...');
  });

  it('fits more characters for narrow glyphs than wide glyphs at the same budget', () => {
    const wide = makeLabel('MMMMMMMMMM', 10);
    const narrow = makeLabel('iiiiiiiiii', 3);
    truncateLabel(wide, 40);
    truncateLabel(narrow, 40);
    expect(wide.text().replace('...', '').length).toBeLessThan(narrow.text().replace('...', '').length);
  });
});

import { createViz } from './matrix.js';

describe('matrix.js accessibility / keyboard navigation', () => {
  const rowNames = ['row-a', 'row-b', 'row-c'];
  const colNames = ['col-a', 'col-b', 'col-c'];

  const makeCell = (row, col) => ({
    row,
    col,
    val: 1,
    color: '#000000',
    display: { text: '1', suffix: '' },
  });
  const data = rowNames.map((row) => colNames.map((col) => makeCell(row, col)));

  const theme = {
    visualization: { getColorByName: (name) => name },
    typography: { fontFamily: 'sans-serif' },
    colors: { text: { primary: '#000' } },
  };

  const options = {
    sourceText: 'From',
    targetText: 'To',
    valueText: 'Value',
    cellSize: 20,
    cellPadding: 10,
    txtLength: 50,
    txtSize: 10,
    url: '',
    urlVar1: '',
    urlVar2: '',
    defaultColor: '#E6E6E6',
  };

  const styles = {
    tooltip: '',
    tooltipTable: '',
    tooltipTableCell: '',
    tooltipTableRowLabel: '',
    tooltipTableRowValue: '',
    matrixA11yFocus: '',
  };

  function render() {
    const container = document.createElement('div');
    document.body.appendChild(container);
    createViz(container, 1, rowNames, colNames, data, options, theme, [], styles, [], []);
    return container;
  }

  const cellAt = (container, r, c) => container.querySelector(`rect[data-row-idx="${r}"][data-col-idx="${c}"]`);

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('marks the root svg with role=img and a computed aria-label', () => {
    const container = render();
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('3 by 3 matrix');
  });

  it('gives exactly one cell tabindex="0" and the rest "-1"', () => {
    const container = render();
    const rects = Array.from(container.querySelectorAll('rect[data-row-idx]'));
    expect(rects).toHaveLength(9);

    const active = rects.filter((r) => r.getAttribute('tabindex') === '0');
    expect(active).toHaveLength(1);
    expect(active[0].getAttribute('data-row-idx')).toBe('0');
    expect(active[0].getAttribute('data-col-idx')).toBe('0');

    const inactive = rects.filter((r) => r.getAttribute('tabindex') === '-1');
    expect(inactive).toHaveLength(8);
  });

  it('adds a role and aria-label to each cell reflecting row/col/value', () => {
    const container = render();
    const cell = cellAt(container, 0, 1);
    expect(cell.getAttribute('role')).toBe('button');
    expect(cell.getAttribute('aria-label')).toContain('row-a');
    expect(cell.getAttribute('aria-label')).toContain('col-b');
  });

  it('moves the roving tabindex one cell per arrow key press', () => {
    const container = render();

    cellAt(container, 0, 0).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(cellAt(container, 0, 0).getAttribute('tabindex')).toBe('-1');
    expect(cellAt(container, 0, 1).getAttribute('tabindex')).toBe('0');

    cellAt(container, 0, 1).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(cellAt(container, 0, 1).getAttribute('tabindex')).toBe('-1');
    expect(cellAt(container, 1, 1).getAttribute('tabindex')).toBe('0');

    cellAt(container, 1, 1).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(cellAt(container, 1, 1).getAttribute('tabindex')).toBe('-1');
    expect(cellAt(container, 1, 0).getAttribute('tabindex')).toBe('0');

    cellAt(container, 1, 0).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(cellAt(container, 1, 0).getAttribute('tabindex')).toBe('-1');
    expect(cellAt(container, 0, 0).getAttribute('tabindex')).toBe('0');
  });

  it('clamps at the matrix edges instead of moving off the grid', () => {
    const container = render();

    cellAt(container, 0, 0).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(cellAt(container, 0, 0).getAttribute('tabindex')).toBe('0');

    cellAt(container, 0, 0).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(cellAt(container, 0, 0).getAttribute('tabindex')).toBe('0');
  });
});

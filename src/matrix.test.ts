import { createViz } from './matrix.js';

const rowNames = ['row-a', 'row-b', 'row-c'];
const colNames = ['col-a', 'col-b', 'col-c', 'col-d', 'col-e', 'col-f', 'col-g', 'col-h'];

const data = rowNames.map((rowName) =>
  colNames.map((colName) => ({
    row: rowName,
    col: colName,
    val: 1,
    color: '#123456',
    display: { text: '1', suffix: '', color: '#123456' },
  }))
);

const theme: any = {
  visualization: { getColorByName: (name: string) => name },
  typography: { fontFamily: 'sans-serif' },
  colors: { text: { primary: '#000' }, border: { weak: '#ccc' } },
  components: { tooltip: { background: '#fff', text: '#000' } },
  shadows: { z3: 'none' },
  shape: { radius: { default: '2px' } },
};

const styles: any = {
  tooltip: 'tooltip',
  tooltipTable: 'tooltipTable',
  tooltipTableCell: 'tooltipTableCell',
  tooltipTableRowLabel: 'tooltipTableRowLabel',
  tooltipTableRowValue: 'tooltipTableRowValue',
};

const baseOptions: any = {
  sourceText: 'From',
  targetText: 'To',
  valueText: 'Value',
  cellPadding: 5,
  txtLength: 50,
  txtSize: 10,
  url: '',
  urlVar1: '',
  urlVar2: '',
  defaultColor: '#E6E6E6',
  enableColGrouping: false,
  enableRowGrouping: false,
  showLegend: false,
  cellSize: 20,
  fitToPanel: false,
};

function renderAndGetSvgWidth(options: any, panelWidth?: number): number {
  const elem = document.createElement('div');
  document.body.appendChild(elem);
  createViz(elem, 1, rowNames, colNames, data, options, theme, [], styles, [], [], panelWidth);
  const svg = elem.querySelector('svg');
  return Number(svg?.getAttribute('width'));
}

describe('fitToPanel', () => {
  it('shrinks cell size (and SVG width) to fit when the panel is narrower than the natural width', () => {
    const naturalWidth = renderAndGetSvgWidth({ ...baseOptions, fitToPanel: false });
    const panelWidth = 60; // narrower than the natural SVG width (margin + colNames.length * cellSize)
    const fittedWidth = renderAndGetSvgWidth({ ...baseOptions, fitToPanel: true }, panelWidth);

    expect(fittedWidth).toBeLessThan(naturalWidth);
    // The rendered SVG is the cell grid PLUS a fixed left margin (row-label space, unaffected by
    // cellSize). A correct "fit" shrinks cellSize so margin + cells lands back on panelWidth exactly
    // -- not on panelWidth + margin, which would still overflow the panel by the margin's width.
    expect(fittedWidth).toBeCloseTo(panelWidth, 5);
  });

  it('leaves layout unchanged when fitToPanel is false (default), even if narrower than a hypothetical panel', () => {
    const withoutFit = renderAndGetSvgWidth({ ...baseOptions, fitToPanel: false }, 60);
    const noPanelWidthArg = renderAndGetSvgWidth({ ...baseOptions, fitToPanel: false });

    expect(withoutFit).toBe(noPanelWidthArg);
  });

  it('never scales cells up when the panel is wider than the natural width', () => {
    const naturalWidth = renderAndGetSvgWidth({ ...baseOptions, fitToPanel: false });
    const widerPanelWidth = 10000;
    const fittedWidth = renderAndGetSvgWidth({ ...baseOptions, fitToPanel: true }, widerPanelWidth);

    expect(fittedWidth).toBe(naturalWidth);
  });
});

import { createTheme, FieldType, getDisplayProcessor, LoadingState, PanelData, toDataFrame } from '@grafana/data';
import { interpolateRdBu, interpolateViridis } from 'd3-scale-chromatic';
import { parseData } from './dataParser';
import { DataMatrixCell, MatrixOptions } from './types';

const theme = createTheme();

function buildPanelData(values: Array<number | null>): PanelData {
  const frame = toDataFrame({
    fields: [
      { name: 'source', type: FieldType.string, values: values.map((_, i) => `row${i}`) },
      { name: 'target', type: FieldType.string, values: values.map((_, i) => `col${i}`) },
      { name: 'value', type: FieldType.number, values },
    ],
  });
  frame.fields.forEach((field) => {
    field.display = getDisplayProcessor({ field, theme });
  });
  return {
    state: LoadingState.Done,
    series: [frame],
    timeRange: {} as any,
  } as PanelData;
}

const baseOptions: MatrixOptions = {
  sortType: 'natural-asc',
  sourceField: 'source',
  targetField: 'target',
  valueField: 'value',
  colCategoryField: '',
  enableColGrouping: false,
  colCategoryHeaderHeight: 100,
  colCategoryGap: 4,
  rowCategoryField: '',
  enableRowGrouping: false,
  rowCategoryHeaderWidth: 100,
  rowCategoryGap: 4,
  cellSize: 15,
  cellPadding: 5,
  txtLength: 50,
  txtSize: 10,
  nullColor: '#E6E6E6',
  defaultColor: '#E6E6E6',
  cellColorMode: 'standard',
  colorScaleMin: NaN,
  colorScaleMax: NaN,
  sourceText: 'From',
  targetText: 'To',
  valueText: 'Value',
  addUrl: false,
  url: '',
  urlVar1: '',
  urlVar2: '',
  urlOther: false,
  urlOtherText: '',
  inputList: false,
  staticRows: '',
  staticColumns: '',
  showLegend: false,
  legendType: 'range',
  thresholds: [],
};

// Diagonal fixtures: value[i] lives at dataMatrix[i][i], since rowN/colN sort
// naturally in insertion order and each row only has one matching column.
function diagonalCell(data: PanelData, options: MatrixOptions, i: number): DataMatrixCell {
  const result = parseData(data, options, theme);
  return (result.data as DataMatrixCell[][])[i][i];
}

describe('parseData cell color modes', () => {
  it('standard mode matches the field display color (no regression)', () => {
    const values = [1, 2, 3];
    const data = buildPanelData(values);
    const options: MatrixOptions = { ...baseOptions, cellColorMode: 'standard' };
    const valueField = data.series[0].fields.find((f) => f.name === 'value')!;

    values.forEach((v, i) => {
      const cell = diagonalCell(data, options, i);
      expect(cell.color).toEqual(valueField.display!(v).color);
    });
  });

  it('sequential mode maps min/max/midpoint onto the viridis interpolator', () => {
    const values = [0, 5, 10];
    const data = buildPanelData(values);
    const options: MatrixOptions = { ...baseOptions, cellColorMode: 'sequential' };

    expect(diagonalCell(data, options, 0).color).toEqual(interpolateViridis(0));
    expect(diagonalCell(data, options, 1).color).toEqual(interpolateViridis(0.5));
    expect(diagonalCell(data, options, 2).color).toEqual(interpolateViridis(1));
  });

  it('diverging mode centers on the midpoint using the RdBu interpolator', () => {
    const values = [-10, 0, 10];
    const data = buildPanelData(values);
    const options: MatrixOptions = { ...baseOptions, cellColorMode: 'diverging' };

    expect(diagonalCell(data, options, 0).color).toEqual(interpolateRdBu(0));
    expect(diagonalCell(data, options, 1).color).toEqual(interpolateRdBu(0.5));
    expect(diagonalCell(data, options, 2).color).toEqual(interpolateRdBu(1));
  });

  it('explicit min/max clamp out-of-range values to the scale endpoints', () => {
    const values = [-5, 0, 15];
    const data = buildPanelData(values);
    const options: MatrixOptions = { ...baseOptions, cellColorMode: 'sequential', colorScaleMin: 0, colorScaleMax: 10 };

    // -5 is below colorScaleMin=0, so it should clamp to the same color as 0.
    expect(diagonalCell(data, options, 0).color).toEqual(interpolateViridis(0));
    expect(diagonalCell(data, options, 1).color).toEqual(interpolateViridis(0));
    // 15 is above colorScaleMax=10, so it should clamp to the same color as 10.
    expect(diagonalCell(data, options, 2).color).toEqual(interpolateViridis(1));
  });
});

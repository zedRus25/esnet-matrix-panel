import { createTheme, FieldType, PanelData, toDataFrame } from '@grafana/data';
import { parseData } from './dataParser';
import { MatrixOptions } from './types';

const theme = createTheme();

const baseOptions: MatrixOptions = {
  sortType: 'none',
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
  sourceText: 'From',
  targetText: 'To',
  valueText: 'Value',
  extraTooltipFields: '',
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

function buildPanelData(withStatusRegion: boolean): PanelData {
  const fields: any[] = [
    { name: 'source', type: FieldType.string, values: ['a', 'a'] },
    { name: 'target', type: FieldType.string, values: ['x', 'y'] },
    { name: 'value', type: FieldType.number, values: [1, 2] },
  ];
  if (withStatusRegion) {
    fields.push({ name: 'status', type: FieldType.string, values: ['ok', 'error'] });
    fields.push({ name: 'region', type: FieldType.string, values: ['us-east', 'us-west'] });
  }
  const frame = toDataFrame({ fields });
  const valueField = frame.fields.find((f) => f.name === 'value')!;
  valueField.display = (v: unknown) => ({ text: String(v), numeric: v as number, color: '#000000' });
  return { series: [frame] } as unknown as PanelData;
}

describe('parseData extraTooltipFields', () => {
  it('attaches extra fields to each cell when extraTooltipFields is set', () => {
    const data = buildPanelData(true);
    const options: MatrixOptions = { ...baseOptions, extraTooltipFields: 'status,region' };
    const result = parseData(data, options, theme);
    const matrix = result.data as any[][];
    expect(matrix[0][0].extra).toEqual({ status: 'ok', region: 'us-east' });
    expect(matrix[0][1].extra).toEqual({ status: 'error', region: 'us-west' });
  });

  it('leaves extra undefined by default (no behavior change)', () => {
    const data = buildPanelData(true);
    const result = parseData(data, baseOptions, theme);
    const matrix = result.data as any[][];
    expect(matrix[0][0].extra).toBeUndefined();
  });

  it('resolves missing fields to an empty string instead of throwing', () => {
    const data = buildPanelData(false);
    const options: MatrixOptions = { ...baseOptions, extraTooltipFields: 'status,region' };
    const result = parseData(data, options, theme);
    const matrix = result.data as any[][];
    expect(matrix[0][0].extra).toEqual({ status: '', region: '' });
  });
});

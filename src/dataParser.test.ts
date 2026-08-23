import { createTheme, FieldType, PanelData, toDataFrame } from '@grafana/data';
import { parseData } from './dataParser';
import { MatrixOptions } from './types';

const theme = createTheme();

function makeOptions(overrides: Partial<MatrixOptions> = {}): MatrixOptions {
  return {
    sortType: 'none',
    sourceField: 'source',
    targetField: 'target',
    valueField: 'value',
    colCategoryField: '',
    enableColGrouping: false,
    colCategoryHeaderHeight: 0,
    colCategoryGap: 0,
    rowCategoryField: '',
    enableRowGrouping: false,
    rowCategoryHeaderWidth: 0,
    rowCategoryGap: 0,
    cellSize: 20,
    cellPadding: 2,
    txtLength: 100,
    txtSize: 12,
    nullColor: 'text',
    defaultColor: 'text',
    sourceText: 'Source',
    targetText: 'Target',
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
    ...overrides,
  };
}

function makePanelData(series: PanelData['series']): PanelData {
  return { series } as unknown as PanelData;
}

describe('parseData reason codes', () => {
  it('sets reason "no-series" when there is no series at all', () => {
    const result = parseData(makePanelData([]), makeOptions(), theme);
    expect(result.reason).toBe('no-series');
    expect(result.data).toBeNull();
  });

  it('sets reason "no-field-mapping" when no usable source/target/value fields exist', () => {
    const frame = toDataFrame({
      fields: [{ name: 'flag', type: FieldType.boolean, values: [true, false] }],
    });
    const result = parseData(makePanelData([frame]), makeOptions(), theme);
    expect(result.reason).toBe('no-field-mapping');
    expect(result.data).toBeNull();
  });

  it('sets reason "no-rows-or-cols" when the query returns zero rows', () => {
    const frame = toDataFrame({
      fields: [
        { name: 'source', type: FieldType.string, values: [] },
        { name: 'target', type: FieldType.string, values: [] },
        { name: 'value', type: FieldType.number, values: [] },
      ],
    });
    const result = parseData(makePanelData([frame]), makeOptions(), theme);
    expect(result.reason).toBe('no-rows-or-cols');
    expect(result.data).toBeNull();
  });

  it('sets reason "too-many-cells" when the resulting matrix would exceed 50000 cells', () => {
    const frame = toDataFrame({
      fields: [
        { name: 'source', type: FieldType.string, values: ['a'] },
        { name: 'target', type: FieldType.string, values: ['b'] },
        { name: 'value', type: FieldType.number, values: [1] },
      ],
    });
    const staticRows = Array.from({ length: 300 }, (_, i) => `row${i}`).join(',');
    const staticColumns = Array.from({ length: 200 }, (_, i) => `col${i}`).join(',');
    const result = parseData(
      makePanelData([frame]),
      makeOptions({ inputList: true, staticRows, staticColumns }),
      theme
    );
    expect(result.reason).toBe('too-many-cells');
    expect(result.data).toBe('too many inputs');
  });

  it('leaves reason undefined for a normal, successful parse', () => {
    const frame = toDataFrame({
      fields: [
        { name: 'source', type: FieldType.string, values: ['a', 'b'] },
        { name: 'target', type: FieldType.string, values: ['x', 'y'] },
        { name: 'value', type: FieldType.number, values: [1, 2] },
      ],
    });
    const result = parseData(makePanelData([frame]), makeOptions(), theme);
    expect(result.reason).toBeUndefined();
    expect(result.rowNames).not.toBeNull();
    expect(result.colNames).not.toBeNull();
  });
});

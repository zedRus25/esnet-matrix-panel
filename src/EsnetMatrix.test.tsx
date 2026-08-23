import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

jest.mock('@grafana/ui', () => ({
  useTheme2: () => ({}),
  CustomScrollbar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('./matrix.js', () => ({
  matrix: () => React.createRef<HTMLDivElement>(),
}));

jest.mock('dataParser', () => ({
  parseData: jest.fn(),
}));

import { EsnetMatrix } from './EsnetMatrix';
import { parseData } from 'dataParser';

const baseParsedData = {
  rowNames: ['host-01', 'host-02'],
  colNames: ['dc-a', 'dc-b'],
  colCategories: [],
  rowCategories: [],
  legend: [],
  data: [
    [
      { row: 'host-01', col: 'dc-a', val: 1, color: '#000', display: { text: '1', suffix: '' } },
      -1,
    ],
    [
      { row: 'host-02', col: 'dc-a', val: 2, color: '#000', display: { text: '2', suffix: 'ms' } },
      -1,
    ],
  ],
};

describe('EsnetMatrix accessible table view', () => {
  const baseProps: any = {
    data: {},
    width: 400,
    height: 400,
    id: 1,
    fieldConfig: {},
  };

  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (parseData as jest.Mock).mockReturnValue(baseParsedData);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  function renderMatrix(options: any) {
    act(() => {
      root.render(<EsnetMatrix {...baseProps} options={options} />);
    });
  }

  it('renders no table when accessibleTableView is off', () => {
    renderMatrix({ accessibleTableView: false });
    expect(container.querySelector('table')).toBeNull();
  });

  it('renders a table matching the parsed data when accessibleTableView is on', () => {
    renderMatrix({ accessibleTableView: true });

    const table = container.querySelector('table');
    expect(table).not.toBeNull();

    const rows = table!.querySelectorAll('tr');
    // 1 header row + 2 data rows
    expect(rows).toHaveLength(3);

    const columnHeaders = (Array.from(table!.querySelectorAll('th[scope="col"]')) as Element[]).map((el) => el.textContent);
    expect(columnHeaders).toEqual(['', 'dc-a', 'dc-b']);

    const rowHeaders = (Array.from(table!.querySelectorAll('th[scope="row"]')) as Element[]).map((el) => el.textContent);
    expect(rowHeaders).toEqual(['host-01', 'host-02']);

    const cells = (Array.from(table!.querySelectorAll('td')) as Element[]).map((el) => el.textContent);
    expect(cells).toEqual(['1', '', '2 ms', '']);
  });
});

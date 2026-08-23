import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

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

  beforeEach(() => {
    (parseData as jest.Mock).mockReturnValue(baseParsedData);
  });

  it('renders no table when accessibleTableView is off', () => {
    render(<EsnetMatrix {...baseProps} options={{ accessibleTableView: false } as any} />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders a table matching the parsed data when accessibleTableView is on', () => {
    render(<EsnetMatrix {...baseProps} options={{ accessibleTableView: true } as any} />);

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    // 1 header row + 2 data rows
    expect(rows).toHaveLength(3);

    expect(within(table).getByRole('columnheader', { name: 'dc-a' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'dc-b' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'host-01' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'host-02' })).toBeInTheDocument();

    const cells = within(table).getAllByRole('cell');
    expect(cells.map((c) => c.textContent)).toEqual(['1', '', '2 ms', '']);
  });
});

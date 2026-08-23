import React from 'react';
import { FieldConfigSource, PanelProps } from '@grafana/data';
import { MatrixOptions } from 'types';
import { parseData } from 'dataParser';
import { useTheme2, CustomScrollbar } from '@grafana/ui';

import * as Matrix from './matrix.js';

interface Props extends PanelProps<MatrixOptions> {
  fieldConfig: FieldConfigSource;
  options: MatrixOptions;
}

// Visually hides content while keeping it in the accessibility tree (unlike
// `display: none`, which removes it from both the layout and the a11y tree).
const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export const EsnetMatrix: React.FC<Props> = ({ options, data, width, height, id }) => {
  const theme = useTheme2();
  // console.log(options);
  const parsedData = parseData(data, options, theme);
  const { rowNames, colNames, data: matrixData, legend, colCategories, rowCategories } = parsedData;

  if (typeof matrixData === "string") {
    console.error(matrixData);
    switch (matrixData) {
      case 'too many inputs':
        return <div>Too many data points!  Try adding limits to your query.</div>;
        break;
      default:
        return <div>Unknown error: {matrixData}</div>;
    }
  }

  if (
    rowNames === null
    || colNames === null
    || matrixData === null
    || legend === null) {
    return <div>No data</div>;
  }

  const ref = Matrix.matrix(
    rowNames,
    colNames,
    matrixData,
    id,
    options,
    legend,
    colCategories,
    rowCategories,
  );
  const thisPanelClass = `matrix-panel-${id}`;

  return (
    <CustomScrollbar autoHeightMin="100%">
      <div ref={ref} id={thisPanelClass}></div>
      {options.accessibleTableView && (
        <table style={visuallyHiddenStyle}>
          <caption>{`${rowNames.length} by ${colNames.length} matrix`}</caption>
          <thead>
            <tr>
              <th scope="col"></th>
              {colNames.map((colName, colIdx) => (
                <th scope="col" key={`col-${colIdx}`}>{colName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowNames.map((rowName, rowIdx) => (
              <tr key={`row-${rowIdx}`}>
                <th scope="row">{rowName}</th>
                {colNames.map((colName, colIdx) => {
                  const cell = matrixData[rowIdx][colIdx];
                  return (
                    <td key={`cell-${rowIdx}-${colIdx}`}>
                      {typeof cell === 'number' ? '' : `${cell.display.text}${cell.display.suffix ? ' ' + cell.display.suffix : ''}`}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CustomScrollbar>
  );
};

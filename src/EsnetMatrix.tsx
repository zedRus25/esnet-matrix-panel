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

const NO_DATA_MESSAGES: Record<string, string> = {
  'no-series': "No data returned by the query. Check the panel's data source and query.",
  'no-field-mapping': "Couldn't find Rows, Columns, or Value fields in the query result. Map them under Row/Column Options, or add a string field for Rows/Columns and a numeric field for Value.",
  'no-rows-or-cols': 'The query returned data, but no row or column headings could be built from it. Check the Rows/Columns field mapping.',
};

export const EsnetMatrix: React.FC<Props> = ({ options, data, width, height, id }) => {
  const theme = useTheme2();
  // console.log(options);
  const parsedData = parseData(data, options, theme);
  if (typeof parsedData.data === "string") {
    console.error(parsedData.data);
    switch (parsedData.data) {
      case 'too many inputs':
        return <div>Too many data points!  Try adding limits to your query.</div>;
        break;
      default:
        return <div>Unknown error: {parsedData.data}</div>;
    }
  }

  if (
    parsedData.rowNames === null
    || parsedData.colNames === null
    || parsedData.data === null
    || parsedData.legend === null) {
    const message = parsedData.reason ? NO_DATA_MESSAGES[parsedData.reason] : undefined;
    return <div>{message ?? 'No data'}</div>;
  }

  const ref = Matrix.matrix(
    parsedData.rowNames,
    parsedData.colNames,
    parsedData.data,
    id,
    options,
    parsedData.legend,
    parsedData.colCategories,
    parsedData.rowCategories,
  );
  const thisPanelClass = `matrix-panel-${id}`;

  return (
    <CustomScrollbar autoHeightMin="100%">
      <div ref={ref} id={thisPanelClass}></div>
    </CustomScrollbar>
  );
};

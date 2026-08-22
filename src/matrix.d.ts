import { MatrixData, MatrixOptions } from './types';

export function createViz(
  elem: Element | null,
  id: number,
  rowNames: any[],
  colNames: any[],
  matrix: DataMatrixCell[][],
  options: MatrixOptions,
  theme: any,
  legend: LegendData[],
  styles: any,
  colCategories: Category[],
  rowCategories: Category[],
  panelWidth?: number,
): void;

export function matrix(
  rowNames: any[],
  colNames: any[],
  matrix: DataMatrixCell[][],
  id: number,
  options: MatrixOptions,
  legend: LegendData[],
  colCategories: Category[],
  rowCategories: Category[],
  panelWidth?: number,
): LegacyRef<SVGSVGElement> | undefined;

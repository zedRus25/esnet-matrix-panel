import { test, expect } from '@grafana/plugin-e2e';

test.describe('esnet-matrix-panel', () => {
  test('default panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('1');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-1')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/default-panel.png' });
  });

  test('grouped/aggregated panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('2');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-2')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/grouped-panel.png' });
  });

  test('static row/column headings panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('3');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-3')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/static-headings-panel.png' });
  });

  test('null vs no-data cells panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('4');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-4')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/null-vs-nodata-panel.png' });
  });

  test('categorical legend panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('5');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-5')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/categorical-legend-panel.png' });
  });

  test('data link URL panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('6');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-6')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/data-link-panel.png' });
  });

  test('column grouping only panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('7');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-7')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/col-grouping-only-panel.png' });
  });

  test('row grouping only panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('8');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-8')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/row-grouping-only-panel.png' });
  });

  test('sort type natural-desc panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('9');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-9')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/sort-natural-desc-panel.png' });
  });

  test('sort type none with grouping panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('10');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-10')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/sort-none-grouping-panel.png' });
  });

  test('threshold-based coloring panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('11');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-11')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/threshold-coloring-panel.png' });
  });

  test('long-label truncation panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('12');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-12')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/long-label-truncation-panel.png' });
  });

  test('CSV data shape panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('13');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-13')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/csv-data-shape-panel.png' });
  });

  test('natural-asc sort orders numeric-suffixed labels numerically, not lexically', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('14');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-14')).toBeVisible();

    // node1, node2, node10, nodeA in that order proves numeric-aware
    // ordering; a lexical sort would instead produce node1, node10, node2, nodeA.
    const labels = await panel.locator.locator('#svg-14 .y-axis text').allTextContents();
    expect(labels).toEqual(['node1', 'node2', 'node10', 'nodeA']);

    await panel.locator.screenshot({ path: 'test-results/screenshots/sort-natural-asc-numeric-panel.png' });
  });

  test('custom field names panel renders without error and ignores extra columns', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('15');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-15')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/custom-field-names-panel.png' });
  });

  test('panel with no saved sortType migrates to natural-asc', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('16');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-16')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/sorttype-migration-panel.png' });
  });

  test('custom grouping header dimensions panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('17');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-17')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/custom-grouping-headers-panel.png' });
  });

  test('accessible table view panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('18');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-18')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/accessible-table-view-panel.png' });
  });

  test('keyboard navigation moves the roving tabindex between cells', async ({ gotoDashboardPage, readProvisionedDashboard, page }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('18');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();

    const firstCell = panel.locator.locator('#svg-18 rect[data-row-idx="0"][data-col-idx="0"]');
    const secondCell = panel.locator.locator('#svg-18 rect[data-row-idx="0"][data-col-idx="1"]');
    await expect(firstCell).toHaveAttribute('tabindex', '0');

    await firstCell.focus();
    await page.keyboard.press('ArrowRight');

    await expect(secondCell).toHaveAttribute('tabindex', '0');
    await expect(firstCell).toHaveAttribute('tabindex', '-1');
    await expect(secondCell).toBeFocused();
  });

  test('accessible table view exposes the matrix data as a native HTML table', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('18');
    await panel.locator.scrollIntoViewIfNeeded();
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();

    const table = panel.locator.locator('table');
    await expect(table).toHaveCount(1);
    await expect(table.locator('th[scope="row"]')).toHaveCount(3);
    await expect(table.locator('th[scope="col"]')).toHaveCount(4); // blank corner cell + 3 columns
    await expect(table).toContainText('host-01');
    await expect(table).toContainText('host-02');
    await expect(table).toContainText('host-03');
    await expect(table).toContainText('10');
    await expect(table).toContainText('15');
  });
});

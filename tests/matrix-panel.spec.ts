import { test, expect } from '@grafana/plugin-e2e';

test.describe('esnet-matrix-panel', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[browser ${msg.type()}] ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      console.log(`[browser pageerror] ${err.stack || err.message}`);
    });
  });

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
});

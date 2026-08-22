import { test, expect } from '@grafana/plugin-e2e';

test.describe('esnet-matrix-panel', () => {
  test('default panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('1');
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-1')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/default-panel.png' });
  });

  test('grouped/aggregated panel renders without error', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });

    const panel = dashboardPage.getPanelById('2');
    await expect(panel.locator).toBeVisible();
    await expect(panel.getErrorIcon()).not.toBeVisible();
    await expect(panel.locator.locator('#svg-2')).toBeVisible();
    await panel.locator.screenshot({ path: 'test-results/screenshots/grouped-panel.png' });
  });
});

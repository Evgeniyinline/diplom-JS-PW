const fs = require('node:fs/promises');
const path = require('node:path');

const {
  prepareSummaryConfig,
  renderNotificationImages,
} = require('./render-notification.js');

// Создаёт две демонстрационные картинки без запуска тестов и отправки в Telegram.
async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const config = JSON.parse(await fs.readFile(path.join(rootDir, 'notifications/config.json'), 'utf8'));
  const summaryPath = path.join(rootDir, 'notifications/allure-summary-preview.png');
  const detailsPath = path.join(rootDir, 'notifications/allure-details-preview.png');
  const { renderCollagePng } = await import('@allure-notifications/core');
  const metrics = {
    layers: {
      UI: { total: 23, passed: 20, failed: 1, broken: 0, skipped: 2, unknown: 0, retries: 2, flaky: 1, passRate: 87.0, flakyRate: 4.3 },
      API: { total: 8, passed: 8, failed: 0, broken: 0, skipped: 0, unknown: 0, retries: 1, flaky: 1, passRate: 100, flakyRate: 12.5 },
    },
    totals: { total: 31, passed: 28, failed: 1, broken: 0, skipped: 2, unknown: 0, retries: 3, flaky: 2, passRate: 90.3, flakyRate: 6.5 },
    testTimeMs: 74000,
    runTimeMs: 84600,
    previousDurationMs: 62100,
    durationDeltaMs: 11900,
    durationDeltaPercent: 19.2,
    slowestTests: [
      { layer: 'UI', name: 'Create proposal: validation and calculation', durationMs: 18400 },
      { layer: 'UI', name: 'Manager authorization and logout', durationMs: 12100 },
      { layer: 'API', name: 'Delete avatar and signature files', durationMs: 5300 },
    ],
    failureCategories: [{ name: 'Assertion', count: 1 }],
  };
  const analytics = {
    statistic: { passed: 28, failed: 1, broken: 0, skipped: 2, unknown: 0, total: 31 },
    layers: { ui: 23, api: 8 },
    suites: [{ name: 'UI', count: 23 }, { name: 'API', count: 8 }],
    retries: [{ name: 'UI', count: 2 }, { name: 'API', count: 1 }],
    durationsMs: [5300, 12100, 18400],
    durationsMsByLayer: {
      ui: [3200, 4100, 4800, 5200, 6100, 7200, 12100, 18400],
      api: [400, 600, 800, 900, 1200, 1600, 2100, 5300],
    },
    severities: {},
    hasLayerLabels: true,
    hasKnownLayerLabels: true,
    resultCount: 31,
    history: null,
    stabilityCases: [],
    qualityByLayer: {
      ui: metrics.layers.UI,
      api: metrics.layers.API,
    },
  };

  const renderConfig = prepareSummaryConfig(config);
  const basePng = await renderCollagePng(renderConfig, analytics);
  const { summaryPng, detailsPng } = await renderNotificationImages({
    basePng,
    config: renderConfig,
    metrics,
  });
  await Promise.all([
    fs.writeFile(summaryPath, summaryPng),
    fs.writeFile(detailsPath, detailsPng),
  ]);
  console.log(`Summary preview saved: ${summaryPath}`);
  console.log(`Details preview saved: ${detailsPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

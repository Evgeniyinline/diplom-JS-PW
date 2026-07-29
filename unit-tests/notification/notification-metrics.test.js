const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { loadNotificationMetrics } = require('../../scripts/notification-metrics.js');
const { buildTelegramCaption } = require('../../scripts/send-allure-notification.js');
const {
  formatDelta,
  prepareCoreConfig,
  stabilityRows,
} = require('../../scripts/render-notification.js');

function result({
  historyId,
  name,
  layer,
  status,
  start,
  stop,
  message = '',
}) {
  return {
    uuid: `${historyId}-${start}`,
    historyId,
    name,
    fullName: `${layer.toLowerCase()}/${name}`,
    status,
    start,
    stop,
    labels: [{ name: 'layer', value: layer.toLowerCase() }],
    statusDetails: { message },
  };
}

test('calculates quality, flaky, skipped, timing and failure categories', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'notification-metrics-'));
  const resultsDir = path.join(directory, 'allure-results');
  const historyPath = path.join(directory, 'history.jsonl');
  await fs.mkdir(resultsDir);
  const results = [
    result({ historyId: 'ui-flaky', name: 'Create proposal', layer: 'UI', status: 'failed', start: 1000, stop: 3000 }),
    result({ historyId: 'ui-flaky', name: 'Create proposal', layer: 'UI', status: 'passed', start: 4000, stop: 8000 }),
    result({ historyId: 'ui-skipped', name: 'Edit profile', layer: 'UI', status: 'skipped', start: 9000, stop: 9000 }),
    result({ historyId: 'api-failed', name: 'Create user', layer: 'API', status: 'failed', start: 10000, stop: 13000, message: 'Request timed out' }),
    result({ historyId: 'api-passed', name: 'Delete user', layer: 'API', status: 'passed', start: 14000, stop: 22000 }),
  ];

  await Promise.all(results.map((item, index) => fs.writeFile(
    path.join(resultsDir, `${index}-result.json`),
    JSON.stringify(item),
  )));
  await fs.writeFile(path.join(resultsDir, 'run-metrics.json'), JSON.stringify({ durationMs: 21000 }));
  await fs.writeFile(historyPath, [
    JSON.stringify({ timestamp: 1, testResults: { a: { duration: 12000 } } }),
    JSON.stringify({ timestamp: 2, testResults: { a: { duration: 15000 } } }),
  ].join('\n'));

  const metrics = await loadNotificationMetrics({ resultsDir, historyPath });

  assert.deepEqual(metrics.layers.UI, {
    total: 2,
    passed: 1,
    failed: 0,
    broken: 0,
    skipped: 1,
    unknown: 0,
    retries: 1,
    flaky: 1,
    passRate: 50,
    flakyRate: 50,
  });
  assert.equal(metrics.layers.API.passRate, 50);
  assert.equal(metrics.totals.total, 4);
  assert.equal(metrics.totals.flaky, 1);
  assert.equal(metrics.totals.skipped, 1);
  assert.equal(metrics.testTimeMs, 15000);
  assert.equal(metrics.runTimeMs, 21000);
  assert.equal(metrics.previousDurationMs, 12000);
  assert.equal(metrics.durationDeltaMs, 3000);
  assert.deepEqual(metrics.failureCategories, [{ name: 'Timeout', count: 1 }]);
  assert.equal(metrics.slowestTests[0].name, 'Delete user');
  assert.equal(stabilityRows(metrics).length, 2);
  assert.equal(formatDelta(metrics), '+3.0s (+25.0%)');
});

test('adds skipped and flaky counters to Telegram caption only when needed', () => {
  const caption = buildTelegramCaption(
    { base: { project: 'Project', links: {} } },
    { statistic: { total: 4, passed: 2, failed: 1, broken: 0, skipped: 1 } },
    { totals: { skipped: 1, flaky: 1, flakyRate: 25 } },
  );

  assert.match(caption, /<b>Всего:<\/b> 4\nПройдено: 2\nУпало: 1\nСломано: 0/);
  assert.match(caption, /Пропущено: 1/);
  assert.match(caption, /Нестабильно: 1 \(25\.0%\)/);
});

test('removes empty retries panel and compacts base collage', () => {
  const config = {
    base: {
      chart: {
        height: 1200,
        gridRows: 15,
        items: [
          { type: 'pie' },
          { type: 'suites', groupBy: 'retries' },
        ],
      },
    },
  };
  const prepared = prepareCoreConfig(config, { totals: { retries: 0 } });

  assert.equal(prepared.base.chart.height, 960);
  assert.equal(prepared.base.chart.gridRows, 12);
  assert.deepEqual(prepared.base.chart.items, [{ type: 'pie' }]);
  assert.equal(config.base.chart.items.length, 2);
});

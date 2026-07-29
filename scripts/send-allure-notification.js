const fs = require('node:fs/promises');
const path = require('node:path');
const { loadNotificationMetrics } = require('./notification-metrics.js');
const {
  prepareCoreConfig,
  renderExtendedNotification,
} = require('./render-notification.js');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function addLink(lines, label, title, url) {
  const normalizedUrl = url?.trim();

  if (normalizedUrl) {
    lines.push(`<b>${escapeHtml(label)}:</b> <a href="${escapeHtml(normalizedUrl)}">${escapeHtml(title)}</a>`);
  }
}

// Собирает короткий текст Telegram и добавляет проблемные метрики только при их наличии.
function buildTelegramCaption(config, analytics, metrics = null) {
  const base = config.base ?? {};
  const links = base.links ?? {};
  const statistic = analytics.statistic;
  const lines = [`<b>${escapeHtml(base.project?.trim() || 'Allure Report')}</b>`];

  if (base.environment?.trim()) {
    lines.push(`<b>Окружение:</b> ${escapeHtml(base.environment.trim())}`);
  }

  if (base.comment?.trim()) {
    lines.push(`<b>Комментарий:</b> ${escapeHtml(base.comment.trim())}`);
  }

  lines.push('');
  addLink(lines, 'Отчёт', 'Allure Report', links.report);
  addLink(lines, 'TestOps', 'открыть запуск', links.testops);
  addLink(lines, 'Release Notes', 'посмотреть изменения', links.releaseNotes);
  addLink(lines, 'Artifacts', 'GitHub Actions', links.build);
  lines.push('');
  lines.push(`<b>Всего:</b> ${statistic.total}`);
  lines.push(`Пройдено: ${statistic.passed}`);
  lines.push(`Упало: ${statistic.failed}`);
  lines.push(`Сломано: ${statistic.broken}`);

  if ((metrics?.totals.skipped ?? statistic.skipped) > 0) {
    lines.push(`Пропущено: ${metrics?.totals.skipped ?? statistic.skipped}`);
  }

  if ((metrics?.totals.flaky ?? 0) > 0) {
    lines.push(`Нестабильно: ${metrics.totals.flaky} (${metrics.totals.flakyRate.toFixed(1)}%)`);
  }

  return lines.join('\n');
}

// Загружает отчёт, строит PNG и отправляет его или сохраняет в dry-run режиме.
async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const configPath = path.resolve(rootDir, process.argv[2] || 'notifications/config.runtime.json');
  const outputPath = path.resolve(rootDir, process.argv[3] || 'notifications/allure-notification.png');
  const dryRun = process.argv.includes('--dry-run');
  const { loadConfigFile, resolveTelegramCredentials, sendTelegramPhoto } = await import('allure-notifications');
  const { loadReportAnalytics, renderCollagePng } = await import('@allure-notifications/core');
  const config = await loadConfigFile(configPath);
  const analytics = await loadReportAnalytics(config);
  const configDir = path.dirname(configPath);
  const resultsDir = path.resolve(configDir, config.base.allureResultsFolder ?? '../allure-results');
  const configuredHistoryPath = config.base.chart?.historyPath;
  const historyPath = configuredHistoryPath
    ? path.resolve(configDir, configuredHistoryPath)
    : path.resolve(rootDir, 'allure-history/history.jsonl');
  const metrics = await loadNotificationMetrics({ resultsDir, historyPath });
  analytics.qualityByLayer = Object.fromEntries(
    Object.entries(metrics.layers).map(([layer, value]) => [layer.toLowerCase(), value]),
  );
  const renderConfig = prepareCoreConfig(config, metrics);
  const basePng = await renderCollagePng(renderConfig, analytics);
  const png = await renderExtendedNotification({ basePng, config: renderConfig, metrics });
  const caption = buildTelegramCaption(config, analytics, metrics);

  await fs.writeFile(outputPath, png);

  if (dryRun) {
    console.log(`Telegram notification preview saved: ${outputPath}`);
    return;
  }

  const credentials = resolveTelegramCredentials({
    config,
    env: process.env,
    applyAdrDefaults: false,
  });
  const result = await sendTelegramPhoto({
    credentials,
    png,
    caption,
  });

  console.log(`Telegram notification sent: message_id=${result.messageId}`);
}

module.exports = { buildTelegramCaption };

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

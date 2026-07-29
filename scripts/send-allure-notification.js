const fs = require('node:fs/promises');
const path = require('node:path');
const { loadNotificationMetrics } = require('./notification-metrics.js');
const {
  prepareSummaryConfig,
  renderNotificationImages,
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

// Отправляет две картинки одним Telegram-альбомом и ставит подпись под первой.
async function sendTelegramMediaGroup({ credentials, summaryPng, detailsPng, caption, fetchImpl = fetch }) {
  const form = new FormData();
  const media = [
    {
      type: 'photo',
      media: 'attach://summary',
      caption,
      parse_mode: 'HTML',
    },
    {
      type: 'photo',
      media: 'attach://details',
    },
  ];

  form.set('chat_id', String(credentials.chat));
  form.set('media', JSON.stringify(media));
  form.set('summary', new Blob([summaryPng], { type: 'image/png' }), 'allure-summary.png');
  form.set('details', new Blob([detailsPng], { type: 'image/png' }), 'allure-details.png');

  if (credentials.topic) {
    form.set('message_thread_id', String(credentials.topic));
  }

  if (credentials.replyTo) {
    form.set('reply_parameters', JSON.stringify({ message_id: Number(credentials.replyTo) }));
  }

  const response = await fetchImpl(
    `https://api.telegram.org/bot${credentials.token}/sendMediaGroup`,
    { method: 'POST', body: form },
  );
  const body = await response.json();

  if (!response.ok || !body.ok || !Array.isArray(body.result) || body.result.length !== 2) {
    throw new Error(`Telegram sendMediaGroup failed: ${body.description ?? response.status}`);
  }

  return {
    messageIds: body.result.map((message) => message.message_id),
  };
}

// Загружает отчёт, строит два PNG и отправляет их или сохраняет в dry-run режиме.
async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const configPath = path.resolve(rootDir, process.argv[2] || 'notifications/config.runtime.json');
  const summaryPath = path.resolve(rootDir, process.argv[3] || 'notifications/allure-summary.png');
  const detailsPath = path.resolve(rootDir, process.argv[4] || 'notifications/allure-details.png');
  const dryRun = process.argv.includes('--dry-run');
  const { loadConfigFile, resolveTelegramCredentials } = await import('allure-notifications');
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
  const renderConfig = prepareSummaryConfig(config);
  const basePng = await renderCollagePng(renderConfig, analytics);
  const { summaryPng, detailsPng } = await renderNotificationImages({
    basePng,
    config: renderConfig,
    metrics,
  });
  const caption = buildTelegramCaption(config, analytics, metrics);

  await Promise.all([
    fs.writeFile(summaryPath, summaryPng),
    fs.writeFile(detailsPath, detailsPng),
  ]);

  if (dryRun) {
    console.log(`Telegram summary preview saved: ${summaryPath}`);
    console.log(`Telegram details preview saved: ${detailsPath}`);
    return;
  }

  const credentials = resolveTelegramCredentials({
    config,
    env: process.env,
    applyAdrDefaults: false,
  });
  const result = await sendTelegramMediaGroup({
    credentials,
    summaryPng,
    detailsPng,
    caption,
  });

  console.log(`Telegram notification album sent: message_ids=${result.messageIds.join(',')}`);
}

module.exports = { buildTelegramCaption, sendTelegramMediaGroup };

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

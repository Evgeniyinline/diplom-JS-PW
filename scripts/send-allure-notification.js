const fs = require('node:fs/promises');
const path = require('node:path');

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

function buildTelegramCaption(config, analytics) {
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
  lines.push(
    `<b>Всего:</b> ${statistic.total} · `
      + `пройдено ${statistic.passed} · `
      + `упало ${statistic.failed} · `
      + `сломано ${statistic.broken}`,
  );

  return lines.join('\n');
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const configPath = path.resolve(rootDir, process.argv[2] || 'notifications/config.runtime.json');
  const outputPath = path.resolve(rootDir, process.argv[3] || 'notifications/allure-notification.png');
  const { loadConfigFile, resolveTelegramCredentials, sendTelegramPhoto } = await import('allure-notifications');
  const { loadReportAnalytics, renderCollagePng } = await import('@allure-notifications/core');
  const config = await loadConfigFile(configPath);
  const analytics = await loadReportAnalytics(config);
  const png = await renderCollagePng(config, analytics);
  const credentials = resolveTelegramCredentials({
    config,
    env: process.env,
    applyAdrDefaults: false,
  });
  const caption = buildTelegramCaption(config, analytics);

  await fs.writeFile(outputPath, png);

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

const fs = require('node:fs');
const path = require('node:path');

const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  TEST_STATUS,
  GITHUB_REPOSITORY,
  BRANCH_NAME,
  GITHUB_SHA,
  GITHUB_RUN_NUMBER,
  RUN_URL,
  ALLURE_REPORT_URL,
  ALLURE_TESTOPS_URL,
} = process.env;

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function getAllureStats(resultsDir = 'allure-results') {
  const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    broken: 0,
    skipped: 0,
  };

  if (!fs.existsSync(resultsDir)) {
    return stats;
  }

  const files = fs
    .readdirSync(resultsDir)
    .filter((file) => file.endsWith('-result.json'));

  for (const file of files) {
    const resultPath = path.join(resultsDir, file);
    const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));

    stats.total += 1;

    if (Object.prototype.hasOwnProperty.call(stats, result.status)) {
      stats[result.status] += 1;
    }
  }

  return stats;
}

async function sendTelegramMessage(message) {
  const params = new URLSearchParams({
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'HTML',
    disable_web_page_preview: 'false',
  });

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    body: params,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram notification failed: ${response.status} ${body}`);
  }
}

async function main() {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram secrets are not configured, skipping notification');
    return;
  }

  const stats = getAllureStats();
  const failedTotal = stats.failed + stats.broken;
  const isSuccess = TEST_STATUS === 'success';
  const title = isSuccess ? '🎉 УСПЕХ 🎉' : '🚨 ТЕСТЫ УПАЛИ 🚨';
  const repository = escapeHtml(GITHUB_REPOSITORY);
  const branch = escapeHtml(BRANCH_NAME);
  const runNumber = escapeHtml(GITHUB_RUN_NUMBER);
  const shortSha = escapeHtml((GITHUB_SHA || '').slice(0, 7));
  const commitUrl = `https://github.com/${GITHUB_REPOSITORY}/commit/${GITHUB_SHA}`;

  const message = [
    `<b>${title}</b>`,
    '━━━━━━━━━━━━━━━━━━━━',
    '<b>📊 Статистика тестов:</b>',
    `▫️ Всего пройдено: <b>${stats.total}</b>`,
    `✅ Успешные: <b>${stats.passed}</b>`,
    `❌ Провалено: <b>${failedTotal}</b>`,
    `⏭️ Пропущено: <b>${stats.skipped}</b>`,
    '━━━━━━━━━━━━━━━━━━━━',
    `🔗 <a href="${ALLURE_REPORT_URL}">Allure отчет</a>`,
    `🧪 <a href="${ALLURE_TESTOPS_URL}">Allure TestOps</a>`,
    `📦 <a href="${RUN_URL}">Артефакты</a>`,
    '━━━━━━━━━━━━━━━━━━━━',
    `🏷️ <b>Run #${runNumber}</b>`,
    '<b>GitHub</b>',
    `<a href="${commitUrl}">${repository}@${shortSha}</a>`,
    `Branch: <code>${branch}</code>`,
  ].join('\n');

  await sendTelegramMessage(message);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

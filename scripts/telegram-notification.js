const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

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

const DIGITS = {
  0: ['111', '101', '101', '101', '111'],
  1: ['010', '110', '010', '010', '111'],
  2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'],
  4: ['101', '101', '111', '001', '001'],
  5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'],
  7: ['111', '001', '010', '010', '010'],
  8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '111'],
  '%': ['101', '001', '010', '100', '101'],
  '/': ['001', '001', '010', '100', '100'],
};

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;

    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createPng(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const raw = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    raw[rowOffset] = 0;
    pixels.copy(raw, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  function chunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const length = Buffer.alloc(4);
    const crc = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));

    return Buffer.concat([length, typeBuffer, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function createCanvas(width, height, background) {
  const pixels = Buffer.alloc(width * height * 4);

  function setPixel(x, y, color) {
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return;
    }

    const offset = (Math.floor(y) * width + Math.floor(x)) * 4;
    pixels[offset] = color[0];
    pixels[offset + 1] = color[1];
    pixels[offset + 2] = color[2];
    pixels[offset + 3] = color[3] ?? 255;
  }

  function fillRect(x, y, rectWidth, rectHeight, color) {
    for (let currentY = y; currentY < y + rectHeight; currentY += 1) {
      for (let currentX = x; currentX < x + rectWidth; currentX += 1) {
        setPixel(currentX, currentY, color);
      }
    }
  }

  function drawRing(cx, cy, outerRadius, innerRadius, segments) {
    for (let y = cy - outerRadius; y <= cy + outerRadius; y += 1) {
      for (let x = cx - outerRadius; x <= cx + outerRadius; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < innerRadius || distance > outerRadius) {
          continue;
        }

        const angle = (Math.atan2(dy, dx) + Math.PI * 2.5) % (Math.PI * 2);
        const progress = angle / (Math.PI * 2);
        const segment = segments.find(({ end }) => progress <= end) ?? segments.at(-1);

        setPixel(x, y, segment.color);
      }
    }
  }

  function drawText(text, x, y, scale, color) {
    let cursor = x;

    for (const char of String(text)) {
      const glyph = DIGITS[char];

      if (!glyph) {
        cursor += scale * 2;
        continue;
      }

      for (let row = 0; row < glyph.length; row += 1) {
        for (let column = 0; column < glyph[row].length; column += 1) {
          if (glyph[row][column] !== '1') {
            continue;
          }

          fillRect(cursor + column * scale, y + row * scale, scale, scale, color);
        }
      }

      cursor += scale * 4;
    }
  }

  fillRect(0, 0, width, height, background);

  return {
    pixels,
    fillRect,
    drawRing,
    drawText,
  };
}

function createStatsChart(stats) {
  const width = 900;
  const height = 520;
  const total = Math.max(stats.total, 1);
  const failedTotal = stats.failed + stats.broken;
  const passedPercent = Math.round((stats.passed / total) * 100);
  const failedPercent = failedTotal / total;
  const skippedPercent = stats.skipped / total;
  const passedPercentValue = stats.passed / total;
  const canvas = createCanvas(width, height, [27, 33, 41, 255]);
  const segments = [];
  let end = 0;

  for (const segment of [
    { value: passedPercentValue, color: [73, 214, 100, 255] },
    { value: failedPercent, color: [239, 68, 68, 255] },
    { value: skippedPercent, color: [96, 165, 250, 255] },
  ]) {
    if (segment.value <= 0) {
      continue;
    }

    end += segment.value;
    segments.push({ end, color: segment.color });
  }

  if (segments.length === 0) {
    segments.push({ end: 1, color: [75, 85, 99, 255] });
  }

  canvas.fillRect(0, 0, width, 90, [45, 55, 72, 255]);
  canvas.fillRect(0, 88, width, 2, [75, 85, 99, 255]);
  canvas.drawRing(450, 285, 150, 105, segments);

  const percentText = `${passedPercent}%`;
  const percentX = 450 - percentText.length * 16;
  canvas.drawText(percentText, percentX, 245, 11, [236, 242, 248, 255]);

  const countText = `${stats.passed}/${stats.total}`;
  const countX = 450 - countText.length * 9;
  canvas.drawText(countText, countX, 325, 6, [196, 204, 216, 255]);

  return createPng(width, height, canvas.pixels);
}

async function sendTelegramPhoto(message, photo) {
  const params = new FormData();

  params.append('chat_id', TELEGRAM_CHAT_ID);
  params.append('caption', message);
  params.append('parse_mode', 'HTML');
  params.append('photo', new Blob([photo], { type: 'image/png' }), 'test-summary.png');

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    body: params,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram notification failed: ${response.status} ${body}`);
  }
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

  try {
    await sendTelegramPhoto(message, createStatsChart(stats));
  } catch (error) {
    console.error(error);
    await sendTelegramMessage(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

const CARD_GAP = 14;
const HEADER_HEIGHT = 68;
const COLORS = {
  outer: '#222222',
  card: '#323232',
  header: '#3c3c3c',
  border: '#606060',
  text: '#dcdcdc',
  muted: '#b4b4b4',
  ui: '#e12afb',
  api: '#00b8db',
  other: '#3b82f6',
  passed: '#94ca66',
  warning: '#ffce57',
  failed: '#ff5f57',
};

// Возвращает единый цвет для UI, API или неизвестного слоя.
function colorForLayer(layer) {
  return COLORS[String(layer).toLowerCase()] ?? COLORS.other;
}

// Строит контур скруглённого прямоугольника для карточек и полосок.
function roundRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

// Рисует горизонтальную полоску со скруглёнными краями.
function fillPill(ctx, x, y, width, height, color) {
  if (width <= 0 || height <= 0) {
    return;
  }

  ctx.fillStyle = color;
  roundRectPath(ctx, x, y, width, height, height / 2);
  ctx.fill();
}

// Сокращает длинное название теста по реальной ширине текста.
function truncateToWidth(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  let result = text;
  while (result.length > 3 && ctx.measureText(`${result}...`).width > maxWidth) {
    result = result.slice(0, -1);
  }

  return `${result}...`;
}

// Показывает миллисекунды в читаемом виде: секунды или минуты.
function formatDuration(durationMs) {
  const seconds = Math.max(0, durationMs) / 1000;

  if (seconds < 60) {
    return `${seconds.toFixed(1)} sec.`;
  }

  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${(seconds % 60).toFixed(1)}s`;
}

// Формирует подпись изменения длительности относительно прошлого запуска.
function formatDelta(metrics) {
  if (metrics.durationDeltaMs == null || metrics.durationDeltaPercent == null) {
    return 'No history';
  }

  const sign = metrics.durationDeltaMs > 0 ? '+' : metrics.durationDeltaMs < 0 ? '−' : '';
  const duration = formatDuration(Math.abs(metrics.durationDeltaMs)).replace(' sec.', 's');
  const percent = Math.abs(metrics.durationDeltaPercent).toFixed(1);
  return `${sign}${duration} (${sign}${percent}%)`;
}

// Рисует заголовок карточки в стиле окна с тремя цветными точками.
function drawHeader(ctx, x, y, width, title) {
  ctx.save();
  roundRectPath(ctx, x, y, width, HEADER_HEIGHT, 18);
  ctx.clip();
  ctx.fillStyle = COLORS.header;
  ctx.fillRect(x, y, width, HEADER_HEIGHT);
  ctx.restore();

  const dotY = y + HEADER_HEIGHT / 2;
  [COLORS.failed, '#febc2e', '#28c840'].forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(x + 36 + index * 28, dotY, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.muted;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(title, x + 124, y + 43);
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + HEADER_HEIGHT);
  ctx.lineTo(x + width, y + HEADER_HEIGHT);
  ctx.stroke();
}

// Рисует общую рамку карточки и передаёт её внутреннюю область содержимому.
function drawCard(ctx, x, y, width, height, title, drawBody) {
  ctx.fillStyle = COLORS.card;
  roundRectPath(ctx, x, y, width, height, 18);
  ctx.fill();
  drawHeader(ctx, x, y, width, title);
  drawBody({
    ctx,
    x: x + 24,
    y: y + HEADER_HEIGHT + 20,
    width: width - 48,
    height: height - HEADER_HEIGHT - 40,
  });
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, x + 0.5, y + 0.5, width - 1, height - 1, 18);
  ctx.stroke();
}

// Показывает фактическое время, сумму тестов и разницу с прошлым запуском.
function drawTimingBody({ ctx, x, y, width }, metrics) {
  const columns = [
    ['RUN TIME', formatDuration(metrics.runTimeMs)],
    ['TEST TIME', formatDuration(metrics.testTimeMs)],
    ['VS PREVIOUS', formatDelta(metrics)],
  ];
  const columnWidth = width / columns.length;

  columns.forEach(([label, value], index) => {
    const left = x + index * columnWidth;
    ctx.fillStyle = COLORS.muted;
    ctx.font = '16px sans-serif';
    ctx.fillText(label, left, y + 24);
    ctx.fillStyle = label === 'VS PREVIOUS' && metrics.durationDeltaMs > 0
      ? COLORS.warning
      : COLORS.text;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(value, left, y + 64);
  });
}

// Рисует три самых медленных теста с длительностью и слоем.
function drawSlowTestsBody({ ctx, x, y, width, height }, metrics) {
  const tests = metrics.slowestTests;

  if (!tests.length) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = '20px sans-serif';
    ctx.fillText('No test duration data', x, y + 32);
    return;
  }

  const rowHeight = height / tests.length;
  const maxDuration = Math.max(...tests.map((test) => test.durationMs), 1);
  const layerWidth = 60;
  const nameWidth = 400;
  const barX = x + layerWidth + nameWidth;
  const barMaxWidth = Math.max(80, width - layerWidth - nameWidth - 110);

  tests.forEach((test, index) => {
    const baseline = y + index * rowHeight + rowHeight * 0.58;
    const barWidth = Math.max(4, test.durationMs / maxDuration * barMaxWidth);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = colorForLayer(test.layer);
    ctx.fillText(test.layer, x, baseline);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.fillText(truncateToWidth(ctx, test.name, nameWidth - 20), x + layerWidth, baseline);
    fillPill(ctx, barX, baseline - 16, barWidth, 18, colorForLayer(test.layer));
    ctx.fillText(formatDuration(test.durationMs), barX + barWidth + 8, baseline);
  });
}

// Оставляет только flaky и skipped значения, которые больше нуля.
function stabilityRows(metrics) {
  const rows = [];

  for (const [layer, stats] of Object.entries(metrics.layers)) {
    if (stats.flaky > 0) {
      rows.push({
        name: `${layer} flaky · ${stats.flakyRate.toFixed(1)}%`,
        count: stats.flaky,
        color: colorForLayer(layer),
      });
    }
    if (stats.skipped > 0) {
      rows.push({ name: `${layer} skipped`, count: stats.skipped, color: COLORS.warning });
    }
  }

  return rows;
}

// Рисует универсальный список значений в виде горизонтальных полосок.
function drawCountRows({ ctx, x, y, width, height }, rows, emptyText) {
  if (!rows.length) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = '20px sans-serif';
    ctx.fillText(emptyText, x, y + 32);
    return;
  }

  const maxCount = Math.max(...rows.map((row) => row.count), 1);
  const rowHeight = height / rows.length;
  const labelWidth = 240;
  const maxBarWidth = Math.max(120, width - labelWidth - 60);

  rows.forEach((row, index) => {
    const baseline = y + index * rowHeight + rowHeight * 0.58;
    const barWidth = Math.max(4, row.count / maxCount * maxBarWidth);
    ctx.fillStyle = COLORS.text;
    ctx.font = '20px sans-serif';
    ctx.fillText(row.name, x, baseline);
    fillPill(ctx, x + labelWidth, baseline - 17, barWidth, 20, row.color);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(String(row.count), x + labelWidth + barWidth + 8, baseline);
  });
}

// Оставляет в первой картинке только краткую сводку и уменьшает её высоту.
function prepareSummaryConfig(config) {
  const prepared = JSON.parse(JSON.stringify(config));
  const chart = prepared.base?.chart;

  if (!chart?.items) {
    return prepared;
  }

  chart.items = chart.items.filter((item) => !(
    item.type?.toLowerCase() === 'suites'
    && item.groupBy?.toLowerCase() === 'retries'
  ));
  chart.gridRows = 12;
  chart.height = Math.round((chart.height ?? 1200) * 12 / 15);
  return prepared;
}

// Собирает строки ретраев отдельно по UI и API.
function retryRows(metrics) {
  return Object.entries(metrics.layers)
    .filter(([, stats]) => stats.retries > 0)
    .map(([layer, stats]) => ({
      name: layer,
      count: stats.retries,
      color: colorForLayer(layer),
    }));
}

// Добавляет набор карточек под уже готовой картинкой.
async function appendCardsToImage({ basePng, width, cards, createCanvas, loadImage }) {
  const baseImage = await loadImage(basePng);
  const extraHeight = cards.reduce((sum, card) => sum + card.height + CARD_GAP, 0);
  const canvas = createCanvas(width, baseImage.height + extraHeight);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = COLORS.outer;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(baseImage, 0, 0);

  let top = baseImage.height;
  for (const card of cards) {
    drawCard(ctx, CARD_GAP, top, width - CARD_GAP * 2, card.height, card.title, card.draw);
    top += card.height + CARD_GAP;
  }

  return canvas.toBuffer('image/png');
}

// Рисует отдельную картинку только с диагностическими карточками.
function renderCardsImage({ width, cards, createCanvas }) {
  const height = CARD_GAP + cards.reduce((sum, card) => sum + card.height + CARD_GAP, 0);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = COLORS.outer;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let top = CARD_GAP;
  for (const card of cards) {
    drawCard(ctx, CARD_GAP, top, width - CARD_GAP * 2, card.height, card.title, card.draw);
    top += card.height + CARD_GAP;
  }

  return canvas.toBuffer('image/png');
}

// Делит длинное уведомление на краткую сводку и подробную диагностику.
async function renderNotificationImages({ basePng, config, metrics }) {
  const { createCanvas, loadImage } = await import('@napi-rs/canvas');
  const width = config.base.chart?.width ?? 870;
  const summaryCards = [
    { title: 'Run timing', height: 190, draw: (body) => drawTimingBody(body, metrics) },
  ];
  const detailCards = [];
  const retries = retryRows(metrics);
  const signals = stabilityRows(metrics);

  if (retries.length > 0) {
    detailCards.push({
      title: 'Retries by layer',
      height: Math.max(190, HEADER_HEIGHT + 50 + retries.length * 48),
      draw: (body) => drawCountRows(body, retries, 'No retries'),
    });
  }

  if (signals.length > 0) {
    detailCards.push({
      title: 'Stability signals',
      height: Math.max(190, HEADER_HEIGHT + 50 + signals.length * 48),
      draw: (body) => drawCountRows(body, signals, 'No stability signals'),
    });
  }

  detailCards.push({
    title: 'Slowest tests',
    height: 300,
    draw: (body) => drawSlowTestsBody(body, metrics),
  });

  if (metrics.failureCategories.length > 0) {
    detailCards.push({
      title: 'Failure categories',
      height: Math.max(190, HEADER_HEIGHT + 50 + metrics.failureCategories.length * 48),
      draw: (body) => drawCountRows(
        body,
        metrics.failureCategories.map((row) => ({ ...row, color: COLORS.failed })),
        'No failures',
      ),
    });
  }

  const summaryPng = await appendCardsToImage({
    basePng,
    width,
    cards: summaryCards,
    createCanvas,
    loadImage,
  });
  const detailsPng = renderCardsImage({ width, cards: detailCards, createCanvas });

  return { summaryPng, detailsPng };
}

module.exports = {
  formatDelta,
  formatDuration,
  prepareSummaryConfig,
  renderNotificationImages,
  retryRows,
  stabilityRows,
};

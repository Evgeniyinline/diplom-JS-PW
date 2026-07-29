const fs = require('node:fs/promises');
const path = require('node:path');

const RESULT_SUFFIX = '-result.json';
const LAYER_ORDER = ['UI', 'API', 'OTHER'];

// Приводит любой статус Allure к одному из известных значений.
function normalizeStatus(status) {
  const value = String(status ?? 'unknown').trim().toLowerCase();
  return ['passed', 'failed', 'broken', 'skipped'].includes(value) ? value : 'unknown';
}

// Собирает labels теста в объект, чтобы быстро получать layer, suite и другие поля.
function labelsOf(result) {
  const labels = {};

  for (const label of result.labels ?? []) {
    if (label?.name && label.value != null && labels[label.name] == null) {
      labels[label.name] = String(label.value);
    }
  }

  return labels;
}

// Определяет слой теста: сначала по label, затем по пути к spec-файлу.
function layerOf(result) {
  const labels = labelsOf(result);
  const explicit = labels.layer?.trim().toUpperCase();

  if (explicit === 'UI' || explicit === 'API') {
    return explicit;
  }

  const source = [
    result.fullName,
    labels.package,
    labels.titlePath,
    labels.suite,
    labels.parentSuite,
  ].filter(Boolean).join(' ').replaceAll('\\', '/').toLowerCase();

  if (/(^|[\s/.])api([\s/.]|$)/.test(source)) {
    return 'API';
  }

  if (/(^|[\s/.])ui([\s/.]|$)/.test(source)) {
    return 'UI';
  }

  return 'OTHER';
}

// Возвращает длительность одной попытки теста в миллисекундах.
function durationMsOf(result) {
  if (Number.isFinite(result.start) && Number.isFinite(result.stop)) {
    return Math.max(0, result.stop - result.start);
  }

  return 0;
}

// Даёт всем попыткам одного теста общий ключ для поиска ретраев.
function resultKey(result, fallback) {
  return result.historyId ?? result.fullName ?? result.uuid ?? fallback;
}

// Убирает HTTP-теги из названия, чтобы оно помещалось на диаграмме.
function cleanTestName(result) {
  return String(result.name ?? result.fullName ?? 'Unnamed test')
    .replace(/(?:^|\s)@[A-Z]+(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Определяет понятную категорию падения по тексту ошибки.
function failureCategory(result) {
  const details = result.statusDetails ?? {};
  const text = `${details.message ?? ''}\n${details.trace ?? ''}`.toLowerCase();

  if (/timeout|timed out|exceeded.*time/.test(text)) {
    return 'Timeout';
  }

  if (/assert|expect\(|expected|tobe|toequal|matcher/.test(text)) {
    return 'Assertion';
  }

  if (/econn|network|socket|fetch|request|response|http\s*\d{3}|api/.test(text)) {
    return 'API / Network';
  }

  if (/fixture|beforeall|beforeeach|global setup|setup/.test(text)) {
    return 'Fixture / Setup';
  }

  return normalizeStatus(result.status) === 'failed' ? 'Product error' : 'Test error';
}

// Рекурсивно находит result-файлы Allure во вложенных папках.
async function walkResultFiles(directory, output = []) {
  let entries;

  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return output;
  }

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await walkResultFiles(fullPath, output);
    } else if (entry.isFile() && entry.name.endsWith(RESULT_SUFFIX)) {
      output.push(fullPath);
    }
  }

  return output;
}

// Читает все корректные результаты, не прерывая работу из-за повреждённого файла.
async function readResults(resultsDir) {
  const files = await walkResultFiles(resultsDir);
  const results = [];

  for (const file of files.sort()) {
    try {
      results.push(JSON.parse(await fs.readFile(file, 'utf8')));
    } catch {
      // Invalid or partially written Allure result does not break the notification.
    }
  }

  return results;
}

// Берёт реальное время Playwright или вычисляет его по первой и последней попытке.
async function readRunDuration(runMetricsPath, effectiveResults) {
  try {
    const data = JSON.parse(await fs.readFile(runMetricsPath, 'utf8'));
    if (Number.isFinite(data.durationMs) && data.durationMs >= 0) {
      return data.durationMs;
    }
  } catch {
    // Fall back to the visible interval in Allure results.
  }

  const starts = effectiveResults.map((result) => result.start).filter(Number.isFinite);
  const stops = effectiveResults.map((result) => result.stop).filter(Number.isFinite);

  return starts.length && stops.length
    ? Math.max(0, Math.max(...stops) - Math.min(...starts))
    : 0;
}

// Суммирует длительность тестов одного исторического запуска.
function totalDurationOfRun(run) {
  let total = 0;

  for (const result of Object.values(run?.testResults ?? {})) {
    if (Number.isFinite(result?.duration)) {
      total += Math.max(0, result.duration);
    } else if (Number.isFinite(result?.start) && Number.isFinite(result?.stop)) {
      total += Math.max(0, result.stop - result.start);
    }
  }

  return total;
}

// Находит длительность предыдущего запуска для расчёта разницы.
async function previousTestDuration(historyPath, currentDurationMs) {
  let content;

  try {
    content = await fs.readFile(historyPath, 'utf8');
  } catch {
    return null;
  }

  const runs = content.split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((left, right) => (left.timestamp ?? 0) - (right.timestamp ?? 0));
  const totals = runs.map(totalDurationOfRun).filter((value) => value > 0);

  if (!totals.length) {
    return null;
  }

  const latest = totals.at(-1);
  const tolerance = Math.max(1000, currentDurationMs * 0.02);
  const historyIncludesCurrent = Math.abs(latest - currentDurationMs) <= tolerance;

  return historyIncludesCurrent ? totals.at(-2) ?? null : latest;
}

// Создаёт пустой набор счётчиков для одного слоя тестов.
function emptyLayer() {
  return {
    total: 0,
    passed: 0,
    failed: 0,
    broken: 0,
    skipped: 0,
    unknown: 0,
    retries: 0,
    flaky: 0,
    passRate: 0,
    flakyRate: 0,
  };
}

// Собирает все метрики, которые нужны тексту и дополнительным диаграммам.
async function loadNotificationMetrics({
  resultsDir,
  runMetricsPath = path.join(resultsDir, 'run-metrics.json'),
  historyPath,
  topSlow = 3,
}) {
  const results = await readResults(resultsDir);
  const attemptsByTest = new Map();

  results.forEach((result, index) => {
    const key = resultKey(result, `result-${index}`);
    const attempts = attemptsByTest.get(key) ?? [];
    attempts.push(result);
    attemptsByTest.set(key, attempts);
  });

  const effectiveResults = [];
  const layers = {};
  const categories = {};

  for (const attempts of attemptsByTest.values()) {
    attempts.sort((left, right) => (left.stop ?? left.start ?? 0) - (right.stop ?? right.start ?? 0));
    const latest = attempts.at(-1);
    const layer = layerOf(latest);
    const status = normalizeStatus(latest.status);
    const stats = layers[layer] ?? emptyLayer();

    stats.total++;
    stats[status]++;
    stats.retries += Math.max(0, attempts.length - 1);

    if (
      status === 'passed'
      && attempts.slice(0, -1).some((attempt) => ['failed', 'broken'].includes(normalizeStatus(attempt.status)))
    ) {
      stats.flaky++;
    }

    layers[layer] = stats;
    effectiveResults.push(latest);

    if (status === 'failed' || status === 'broken') {
      const category = failureCategory(latest);
      categories[category] = (categories[category] ?? 0) + 1;
    }
  }

  for (const stats of Object.values(layers)) {
    stats.passRate = stats.total > 0 ? stats.passed / stats.total * 100 : 0;
    stats.flakyRate = stats.total > 0 ? stats.flaky / stats.total * 100 : 0;
  }

  const orderedLayers = Object.fromEntries(
    LAYER_ORDER.filter((layer) => layers[layer]).map((layer) => [layer, layers[layer]]),
  );
  const testTimeMs = effectiveResults.reduce((sum, result) => sum + durationMsOf(result), 0);
  const runTimeMs = await readRunDuration(runMetricsPath, effectiveResults);
  const previousDurationMs = historyPath
    ? await previousTestDuration(historyPath, testTimeMs)
    : null;
  const durationDeltaMs = previousDurationMs == null ? null : testTimeMs - previousDurationMs;
  const durationDeltaPercent = previousDurationMs
    ? durationDeltaMs / previousDurationMs * 100
    : null;
  const slowestTests = effectiveResults
    .filter((result) => normalizeStatus(result.status) !== 'skipped')
    .map((result) => ({
      name: cleanTestName(result),
      layer: layerOf(result),
      durationMs: durationMsOf(result),
    }))
    .sort((left, right) => right.durationMs - left.durationMs)
    .slice(0, Math.max(0, topSlow));
  const categoryRows = Object.entries(categories)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([name, count]) => ({ name, count }));
  const totals = Object.values(orderedLayers).reduce((summary, stats) => {
    for (const key of ['total', 'passed', 'failed', 'broken', 'skipped', 'unknown', 'retries', 'flaky']) {
      summary[key] += stats[key];
    }
    return summary;
  }, emptyLayer());

  totals.passRate = totals.total > 0 ? totals.passed / totals.total * 100 : 0;
  totals.flakyRate = totals.total > 0 ? totals.flaky / totals.total * 100 : 0;

  return {
    layers: orderedLayers,
    totals,
    slowestTests,
    failureCategories: categoryRows,
    testTimeMs,
    runTimeMs,
    previousDurationMs,
    durationDeltaMs,
    durationDeltaPercent,
  };
}

module.exports = {
  cleanTestName,
  failureCategory,
  layerOf,
  loadNotificationMetrics,
  normalizeStatus,
};

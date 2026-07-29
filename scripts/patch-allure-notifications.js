const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const packagePath = path.join(rootDir, 'node_modules/@allure-notifications/core/package.json');
const durationRendererPath = path.join(
  rootDir,
  'node_modules/@allure-notifications/core/dist/src/collage/panels/durations.js',
);
const collageRendererPath = path.join(
  rootDir,
  'node_modules/@allure-notifications/core/dist/src/collage/render.js',
);
const suitesRendererPath = path.join(
  rootDir,
  'node_modules/@allure-notifications/core/dist/src/collage/panels/suites.js',
);
const pieRendererPath = path.join(
  rootDir,
  'node_modules/@allure-notifications/core/dist/src/collage/panels/pie.js',
);
const analyticsPath = path.join(
  rootDir,
  'node_modules/@allure-notifications/core/dist/src/report/analytics.js',
);
const resultsPath = path.join(
  rootDir,
  'node_modules/@allure-notifications/core/dist/src/report/results.js',
);
const supportedVersion = '6.0.8';

const durationReplacements = [
  {
    original: 'function averageSecondsByLayer(byLayer) {',
    customized: 'function totalSecondsByLayer(byLayer) {',
  },
  {
    original: '    const barAreaWidth = Math.max(1, chartWidth - labelWidth - 48);',
    customized: '    const barAreaWidth = Math.max(1, chartWidth - labelWidth - 130);',
  },
  {
    original: 'const DEFAULT_ARC = 10;',
    previous: [
      'const DEFAULT_ARC = 10;',
      '// Project palette: API cyan, UI fuchsia.',
      'const CUSTOM_LAYER_COLORS = { api: "#00b8db", ui: "#8e51ff"" };',
    ].join('\n'),
    customized: [
      'const DEFAULT_ARC = 10;',
      '// Project palette: API cyan, UI fuchsia, total green.',
      'const CUSTOM_LAYER_COLORS = { api: "#00b8db", ui: "#8e51ff", total: "#04c5c2ff" };',
    ].join('\n'),
  },
  {
    original: [
      '    const barH = Math.max(8, Math.floor(rowH * 0.55));',
      '    const fontSize = Math.min(12, Math.max(9, Math.floor(barH)));',
    ].join('\n'),
    previous: [
      '    const barH = Math.min(32, Math.max(12, Math.floor(rowH * 0.18)));',
      '    const fontSize = 18;',
    ].join('\n'),
    customized: [
      '    const barH = Math.min(32, Math.max(12, Math.floor(rowH * 0.18)));',
      '    const fontSize = 24;',
    ].join('\n'),
  },
  {
    original: '        const hex = colorForLayer(key, theme.dark ? "dark" : "light");',
    customized: [
      '        const hex = CUSTOM_LAYER_COLORS[key]',
      '            ?? colorForLayer(key, theme.dark ? "dark" : "light");',
    ].join('\n'),
  },
  {
    original: [
      '        const baseline = top + index * rowH + Math.floor(rowH * 0.7);',
      '        ctx.fillStyle = rgbCss(theme.text);',
      '        ctx.fillText(key, MARGIN, baseline);',
      '        const barWidth = Math.floor((avg / maxAvg) * barAreaWidth);',
      '        const barX = MARGIN + labelWidth;',
      '        const barY = top + index * rowH + Math.floor((rowH - barH) / 2);',
    ].join('\n'),
    customized: [
      '        const barWidth = Math.floor((avg / maxAvg) * barAreaWidth);',
      '        const barX = MARGIN + labelWidth;',
      '        const barY = top + index * rowH + Math.floor((rowH - barH) / 2);',
      '        const ascent = fontSize * 0.8;',
      '        const descent = fontSize * 0.2;',
      '        const baseline = barY + (barH + ascent - descent) / 2;',
      '        ctx.fillStyle = rgbCss(theme.text);',
      '        ctx.fillText(key.toUpperCase(), MARGIN, baseline);',
    ].join('\n'),
  },
  {
    original: '        ctx.fillText(avg.toFixed(1), barX + barWidth + 6, baseline);',
    previous: '        ctx.fillText(`${avg.toFixed(1)} сек.`, barX + barWidth + 6, baseline);',
    customized: '        ctx.fillText(`${avg.toFixed(1)} sec.`, barX + barWidth + 6, baseline);',
  },
  {
    original: '        averages.set(key, sum / samples.length / 1000);',
    customized: '        averages.set(key, sum / 1000);',
  },
  {
    original: [
      '    return averages;',
      '}',
    ].join('\n'),
    customized: [
      '    const total = Array.from(averages.values()).reduce((sum, value) => sum + value, 0);',
      '    if (averages.size > 0) {',
      '        averages.set("total", total);',
      '    }',
      '    return averages;',
      '}',
    ].join('\n'),
  },
  {
    original: [
      '        const avg = averageSecondsByLayer(analytics.durationsMsByLayer);',
      '        if (avg.size > 0) {',
      '            drawLayerAverages(ctx, theme, width, height, showTitle, avg);',
    ].join('\n'),
    customized: [
      '        const totals = totalSecondsByLayer(analytics.durationsMsByLayer);',
      '        if (totals.size > 0) {',
      '            drawLayerAverages(ctx, theme, width, height, showTitle, totals);',
    ].join('\n'),
  },
];

const collageReplacements = [
  {
    original: '            return "Durations by layer (s)";',
    previous: '            return "Average duration (sec.)";',
    customized: '            return "Total duration (sec.)";',
  },
  {
    original: [
      '    if (key === PANEL_SUITES) {',
      '        return "Suites";',
      '    }',
    ].join('\n'),
    customized: [
      '    if (key === PANEL_SUITES) {',
      '        return item.groupBy?.trim().toLowerCase() === "retries" ? "Retries by layer" : "Suites";',
      '    }',
    ].join('\n'),
    previous: [
      '    if (key === PANEL_SUITES) {',
      '        return item.groupBy?.trim().toLowerCase() === "retries" ? "Ретраи тестов" : "Suites";',
      '    }',
    ].join('\n'),
  },
];

const suitesReplacements = [
  {
    original: 'import { MARGIN, TITLE_HEIGHT, fillPill, horizontalBarRowsLayout, } from "./bars.js";',
    previous: [
      'import { MARGIN, TITLE_HEIGHT, fillPill, horizontalBarRowsLayout, } from "./bars.js";',
      'const CUSTOM_SUITE_COLORS = { api: "#00b8db", ui: "#e12afb" };',
    ].join('\n'),
    customized: [
      'import { MARGIN, TITLE_HEIGHT, fillPill, horizontalBarRowsLayout, } from "./bars.js";',
      'const CUSTOM_SUITE_COLORS = { api: "#00b8db", ui: "#e12afb" };',
      'const RETRY_COLOR = "#ffce57";',
    ].join('\n'),
  },
  {
    original: '        ctx.fillStyle = rgbCss(theme.accent);',
    previous: '        ctx.fillStyle = isRetries ? RETRY_COLOR : CUSTOM_SUITE_COLORS[label.toLowerCase()] ?? rgbCss(theme.accent);',
    customized: '        ctx.fillStyle = CUSTOM_SUITE_COLORS[label.toLowerCase()] ?? (isRetries ? RETRY_COLOR : rgbCss(theme.accent));',
  },
  {
    original: '    const { width, height, theme, analytics, showTitle } = context;',
    customized: '    const { width, height, theme, analytics, showTitle, groupBy } = context;',
  },
  {
    original: '    const suites = analytics.suites;',
    customized: [
      '    const isRetries = groupBy?.trim().toLowerCase() === "retries";',
      '    const suites = isRetries ? analytics.retries : analytics.suites;',
    ].join('\n'),
  },
  {
    original: '        ctx.fillText("No suite data", MARGIN, MARGIN + TITLE_HEIGHT + 16);',
    previous: '        ctx.fillText(isRetries ? "Ретраев нет" : "No suite data", MARGIN, MARGIN + TITLE_HEIGHT + 16);',
    customized: '        ctx.fillText(isRetries ? "No retries" : "No suite data", MARGIN, MARGIN + TITLE_HEIGHT + 16);',
  },
  {
    original: '    const labelWidth = Math.min(180, Math.floor(chartWidth / 3));',
    customized: '    const labelWidth = isRetries ? Math.min(360, Math.floor(chartWidth / 2)) : Math.min(180, Math.floor(chartWidth / 3));',
  },
  {
    original: [
      '    ctx.font = `${layout.fontSize}px sans-serif`;',
      '    const ascent = layout.fontSize * 0.8;',
      '    const descent = layout.fontSize * 0.2;',
    ].join('\n'),
    customized: [
      '    const fontSize = isRetries ? 18 : layout.fontSize;',
      '    ctx.font = `${fontSize}px sans-serif`;',
      '    const ascent = fontSize * 0.8;',
      '    const descent = fontSize * 0.2;',
    ].join('\n'),
  },
  {
    original: '        const label = truncate(suite.name, 24);',
    customized: '        const label = truncate(suite.name, isRetries ? 42 : 24);',
  },
];

const pieReplacements = [
  {
    original: '    const subText = `of ${total}`;',
    previous: '    const subText = `из ${total}`;',
    customized: '    const subText = `of ${total}`;',
  },
];

const resultsReplacements = [
  {
    original: '        uuid: typeof obj.uuid === "string" ? obj.uuid : undefined,',
    customized: [
      '        uuid: typeof obj.uuid === "string" ? obj.uuid : undefined,',
      '        historyId: typeof obj.historyId === "string" ? obj.historyId : undefined,',
    ].join('\n'),
  },
];

const analyticsReplacements = [
  {
    original: [
      '    const stabilityCases = [];',
      '    let hasLayerLabels = false;',
    ].join('\n'),
    previous: [
      '    const stabilityCases = [];',
      '    // Allure stores every retry as a result; charts need only the latest attempt.',
      '    const latestResultsByHistory = new Map();',
      '    const attemptsByHistory = new Map();',
      '    for (const result of results) {',
      '        const key = result.historyId ?? result.fullName ?? result.uuid;',
      '        const attempts = attemptsByHistory.get(key) ?? [];',
      '        attempts.push(result);',
      '        attemptsByHistory.set(key, attempts);',
      '        const previous = latestResultsByHistory.get(key);',
      '        if (!previous || (result.stop ?? 0) >= (previous.stop ?? 0)) {',
      '            latestResultsByHistory.set(key, result);',
      '        }',
      '    }',
      '    const effectiveResults = Array.from(latestResultsByHistory.values());',
      '    const retries = Array.from(attemptsByHistory.entries())',
      '        .filter(([, attempts]) => attempts.length > 1)',
      '        .map(([key, attempts]) => {',
      '        const latest = latestResultsByHistory.get(key);',
      '        return {',
      '            name: latest?.name ?? latest?.fullName ?? String(key),',
      '            count: attempts.length - 1,',
      '        };',
      '    })',
      '        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))',
      '        .slice(0, Math.max(topSuites, 0));',
      '    let hasLayerLabels = false;',
    ].join('\n'),
    customized: [
      '    const stabilityCases = [];',
      '    // Allure stores every retry as a result; charts need only the latest attempt.',
      '    const latestResultsByHistory = new Map();',
      '    const attemptsByHistory = new Map();',
      '    for (const result of results) {',
      '        const key = result.historyId ?? result.fullName ?? result.uuid;',
      '        const attempts = attemptsByHistory.get(key) ?? [];',
      '        attempts.push(result);',
      '        attemptsByHistory.set(key, attempts);',
      '        const previous = latestResultsByHistory.get(key);',
      '        if (!previous || (result.stop ?? 0) >= (previous.stop ?? 0)) {',
      '            latestResultsByHistory.set(key, result);',
      '        }',
      '    }',
      '    const effectiveResults = Array.from(latestResultsByHistory.values());',
      '    const retryCountsByLayer = {};',
      '    for (const [key, attempts] of attemptsByHistory) {',
      '        if (attempts.length <= 1) {',
      '            continue;',
      '        }',
      '        const latest = latestResultsByHistory.get(key);',
      '        const layer = latest ? layerOf(latest) : null;',
      '        const suite = latest ? suiteNameOf(latest) : null;',
      '        const group = (layer ?? suite ?? "other").trim().toUpperCase();',
      '        retryCountsByLayer[group] = (retryCountsByLayer[group] ?? 0) + attempts.length - 1;',
      '    }',
      '    const retries = Object.entries(retryCountsByLayer)',
      '        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))',
      '        .map(([name, count]) => ({ name, count }));',
      '    let hasLayerLabels = false;',
    ].join('\n'),
  },
  {
    original: [
      '    let hasKnownLayerLabels = false;',
      '    for (const result of results) {',
    ].join('\n'),
    customized: [
      '    let hasKnownLayerLabels = false;',
      '    for (const result of effectiveResults) {',
    ].join('\n'),
  },
  {
    original: '        resultCount: results.length,',
    customized: '        resultCount: effectiveResults.length,',
  },
  {
    original: [
      '        suites,',
      '        durationsMs: durations,',
    ].join('\n'),
    customized: [
      '        suites,',
      '        retries,',
      '        durationsMs: durations,',
    ].join('\n'),
  },
];

function patchFile(filePath, replacements) {
  let source = fs.readFileSync(filePath, 'utf-8');

  for (const { original, previous, customized } of replacements) {
    if (source.includes(customized)) {
      continue;
    }

    const current = source.includes(original)
      ? original
      : previous && source.includes(previous)
        ? previous
        : null;

    if (!current) {
      throw new Error(`Cannot patch Allure renderer: expected fragment not found: ${original}`);
    }

    source = source.replace(current, customized);
  }

  fs.writeFileSync(filePath, source);
}

function main() {
  if (
    !fs.existsSync(packagePath)
    || !fs.existsSync(durationRendererPath)
    || !fs.existsSync(collageRendererPath)
    || !fs.existsSync(suitesRendererPath)
    || !fs.existsSync(pieRendererPath)
    || !fs.existsSync(analyticsPath)
    || !fs.existsSync(resultsPath)
  ) {
    throw new Error('@allure-notifications/core is not installed');
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

  if (packageJson.version !== supportedVersion) {
    throw new Error(
      `Unsupported @allure-notifications/core version ${packageJson.version}; expected ${supportedVersion}`,
    );
  }

  patchFile(durationRendererPath, durationReplacements);
  patchFile(collageRendererPath, collageReplacements);
  patchFile(suitesRendererPath, suitesReplacements);
  patchFile(pieRendererPath, pieReplacements);
  patchFile(resultsPath, resultsReplacements);
  patchFile(analyticsPath, analyticsReplacements);
  console.log('Applied Allure notification chart customization');
}

main();

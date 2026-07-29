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
const supportedVersion = '6.0.8';

const durationReplacements = [
  {
    original: '    const barAreaWidth = Math.max(1, chartWidth - labelWidth - 48);',
    customized: '    const barAreaWidth = Math.max(1, chartWidth - labelWidth - 130);',
  },
  {
    original: 'const DEFAULT_ARC = 10;',
    customized: [
      'const DEFAULT_ARC = 10;',
      '// Project palette: API cyan, UI fuchsia.',
      'const CUSTOM_LAYER_COLORS = { api: "#00b8db", ui: "#e12afb" };',
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
      '        ctx.fillText(key, MARGIN, baseline);',
    ].join('\n'),
  },
  {
    original: '        ctx.fillText(avg.toFixed(1), barX + barWidth + 6, baseline);',
    customized: '        ctx.fillText(`${avg.toFixed(1)} сек.`, barX + barWidth + 6, baseline);',
  },
];

const collageReplacements = [
  {
    original: '            return "Durations by layer (s)";',
    customized: '            return "Durations by layer (сек.)";',
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
  console.log('Applied Allure duration chart customization');
}

main();

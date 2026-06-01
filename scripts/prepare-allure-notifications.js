const fs = require('node:fs');
const path = require('node:path');

const reportDir = path.resolve('allure-report');
const sourcePath = path.join(reportDir, 'summary.json');
const widgetsDir = path.join(reportDir, 'widgets');
const targetPath = path.join(widgetsDir, 'summary.json');
const rootWidgetsDir = path.resolve('widgets');
const rootTargetPath = path.join(rootWidgetsDir, 'summary.json');

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Allure summary not found: ${sourcePath}`);
}

const summary = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const stats = summary.stats ?? {};
const total = stats.total ?? 0;
const passed = stats.passed ?? 0;
const failed = stats.failed ?? 0;
const broken = stats.broken ?? 0;
const skipped = stats.skipped ?? 0;
const unknown = Math.max(total - passed - failed - broken - skipped, 0);

const widgetSummary = {
  statistic: {
    failed,
    broken,
    skipped,
    passed,
    unknown,
    total,
  },
  time: {
    start: summary.createdAt ?? 0,
    stop: (summary.createdAt ?? 0) + (summary.duration ?? 0),
    duration: summary.duration ?? 0,
  },
};

fs.mkdirSync(widgetsDir, { recursive: true });
fs.writeFileSync(targetPath, `${JSON.stringify(widgetSummary, null, 2)}\n`);
fs.mkdirSync(rootWidgetsDir, { recursive: true });
fs.writeFileSync(rootTargetPath, `${JSON.stringify(widgetSummary, null, 2)}\n`);

console.log(`Prepared Allure notifications summary: ${targetPath}`);
console.log(`Prepared Allure notifications summary: ${rootTargetPath}`);

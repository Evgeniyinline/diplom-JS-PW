const fs = require('node:fs');
const path = require('node:path');

class RunMetricsReporter {
  // После прогона сохраняет его полную длительность для Telegram-уведомления.
  async onEnd(result) {
    const outputDir = path.resolve(process.cwd(), 'allure-results');
    const outputPath = path.join(outputDir, 'run-metrics.json');
    const startTime = result.startTime instanceof Date
      ? result.startTime.toISOString()
      : new Date(Date.now() - result.duration).toISOString();

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify({
      startTime,
      durationMs: Math.max(0, Number(result.duration) || 0),
      status: result.status ?? 'unknown',
    }, null, 2));
  }
}

module.exports = RunMetricsReporter;

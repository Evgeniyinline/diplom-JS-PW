const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const resultsDir = path.join(rootDir, 'allure-results');
const reportDir = path.join(rootDir, 'allure-report');
const configPath = path.join(rootDir, 'allurerc.mjs');
const noOpen = process.argv.includes('--no-open');
const playwrightArgs = process.argv.slice(2).filter((arg) => arg !== '--no-open');

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
}

function ensureAllureCli() {
  const result = spawnSync('allure', ['--version'], {
    cwd: rootDir,
    encoding: 'utf-8',
    shell: process.platform === 'win32',
  });

  if (result.error || result.status !== 0) {
    console.error('Allure CLI is not available. Install Allure Report 3 and try again.');
    process.exit(1);
  }

  process.stdout.write(`Allure CLI: ${result.stdout.trim()}\n`);
}

function cleanReports() {
  fs.rmSync(resultsDir, { recursive: true, force: true });
  fs.rmSync(reportDir, { recursive: true, force: true });
}

function getSummary() {
  if (!fs.existsSync(resultsDir)) {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      broken: 0,
      skipped: 0,
      unknown: 0,
    };
  }

  return fs.readdirSync(resultsDir)
    .filter((file) => file.endsWith('-result.json'))
    .reduce((summary, file) => {
      const result = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf-8'));
      const status = result.status || 'unknown';

      summary.total += 1;
      summary[status] = (summary[status] || 0) + 1;

      return summary;
    }, {
      total: 0,
      passed: 0,
      failed: 0,
      broken: 0,
      skipped: 0,
      unknown: 0,
    });
}

function findFreePort(startPort = 9323) {
  return new Promise((resolve) => {
    const tryPort = (port) => {
      const server = net.createServer();

      server.once('error', () => tryPort(port + 1));
      server.once('listening', () => {
        server.close(() => resolve(port));
      });
      server.listen(port, '127.0.0.1');
    };

    tryPort(startPort);
  });
}

function printSummary(summary) {
  console.log('');
  console.log('Allure summary');
  console.log(`Total:   ${summary.total}`);
  console.log(`Passed:  ${summary.passed}`);
  console.log(`Failed:  ${summary.failed}`);
  console.log(`Broken:  ${summary.broken}`);
  console.log(`Skipped: ${summary.skipped}`);
}

async function main() {
  ensureAllureCli();
  cleanReports();

  const testResult = run('npx', [
    'playwright',
    'test',
    '--reporter=list,allure-playwright',
    ...playwrightArgs,
  ]);
  const summary = getSummary();

  const generateResult = run('allure', [
    'generate',
    './allure-results',
    '--config',
    './allurerc.mjs',
    '--output',
    './allure-report',
  ]);

  printSummary(summary);

  if (generateResult.status !== 0) {
    process.exit(generateResult.status);
  }

  if (noOpen) {
    console.log(`Report generated: ${reportDir}`);
    process.exit(testResult.status || 0);
  }

  const port = await findFreePort();
  const url = `http://127.0.0.1:${port}`;

  console.log('');
  console.log(`Allure report: ${url}`);
  console.log('Press Ctrl+C to stop the report server.');

  const server = spawn('allure', ['open', './allure-report', '--port', String(port)], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  server.on('exit', () => {
    process.exit(testResult.status || 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

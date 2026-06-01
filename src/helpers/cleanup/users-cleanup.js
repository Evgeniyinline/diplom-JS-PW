import fs from 'fs';
import path from 'path';

const CLEANUP_DIR = path.resolve(process.cwd(), '.test-artifacts/users-cleanup');

function ensureCleanupDir() {
  fs.mkdirSync(CLEANUP_DIR, { recursive: true });
}

function getCleanupFileName(testInfo) {
  const safeTitle = testInfo.titlePath
    .join(' ')
    .replace(/[^a-zA-Z0-9а-яА-ЯёЁ]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${Date.now()}-${process.pid}-${safeTitle}.json`;
}

export function addCreatedUsersForCleanup(testInfo, userIds) {
  const uniqueUserIds = [...new Set(userIds)].filter(Boolean);

  if (!uniqueUserIds.length) {
    return;
  }

  ensureCleanupDir();

  const filePath = path.join(CLEANUP_DIR, getCleanupFileName(testInfo));

  fs.writeFileSync(filePath, JSON.stringify({
    test: testInfo.titlePath,
    userIds: uniqueUserIds,
  }, null, 2));
}

export function getCreatedUsersForCleanup() {
  if (!fs.existsSync(CLEANUP_DIR)) {
    return [];
  }

  const userIds = fs.readdirSync(CLEANUP_DIR)
    .filter((file) => file.endsWith('.json'))
    .flatMap((file) => {
      const filePath = path.join(CLEANUP_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      return data.userIds ?? [];
    });

  return [...new Set(userIds)].filter(Boolean);
}

export function clearCreatedUsersCleanup() {
  fs.rmSync(CLEANUP_DIR, { recursive: true, force: true });
}

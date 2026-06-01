import fs from 'fs';
import path from 'path';

const AUTH_DIR = path.resolve(process.cwd(), '.test-artifacts/auth');
const ADMIN_STORAGE_STATE_PATH = path.join(AUTH_DIR, 'admin-storage-state.json');

export function getAdminStorageStatePath() {
  return ADMIN_STORAGE_STATE_PATH;
}

export function ensureAdminStorageStateDir() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

export function readAdminStorageState() {
  return JSON.parse(fs.readFileSync(ADMIN_STORAGE_STATE_PATH, 'utf-8'));
}

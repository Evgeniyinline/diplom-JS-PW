import fs from 'fs';
import path from 'path';

const AUTH_DIR = path.resolve(process.cwd(), '.test-artifacts/auth');
const USERS_DIR = path.resolve(process.cwd(), '.test-artifacts/users');
const ADMIN_STORAGE_STATE_PATH = path.join(AUTH_DIR, 'admin-storage-state.json');
const MANAGER_STORAGE_STATE_PATH = path.join(AUTH_DIR, 'manager-storage-state.json');
const EDIT_PROFILE_STORAGE_STATE_PATH = path.join(AUTH_DIR, 'edit-profile-storage-state.json');
const PREPARED_USERS_PATH = path.join(USERS_DIR, 'prepared-users.json');

export function getAdminStorageStatePath() {
  return ADMIN_STORAGE_STATE_PATH;
}

// путь к storage авторизованного менеджера для обычных UI-тестов
export function getManagerStorageStatePath() {
  return MANAGER_STORAGE_STATE_PATH;
}

// путь к storage отдельного пользователя для тестов профиля
export function getEditProfileStorageStatePath() {
  return EDIT_PROFILE_STORAGE_STATE_PATH;
}

export function ensureAdminStorageStateDir() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.mkdirSync(USERS_DIR, { recursive: true });
}

export function readAdminStorageState() {
  return JSON.parse(fs.readFileSync(ADMIN_STORAGE_STATE_PATH, 'utf-8'));
}

// чтение сохранённой авторизационной сессии менеджера
export function readManagerStorageState() {
  return JSON.parse(fs.readFileSync(MANAGER_STORAGE_STATE_PATH, 'utf-8'));
}

// чтение сохранённой авторизационной сессии пользователя профиля
export function readEditProfileStorageState() {
  return JSON.parse(fs.readFileSync(EDIT_PROFILE_STORAGE_STATE_PATH, 'utf-8'));
}

// сохранение данных пользователей, созданных один раз в globalSetup
export function savePreparedUsers(users) {
  fs.writeFileSync(PREPARED_USERS_PATH, JSON.stringify(users, null, 2));
}

// чтение данных подготовленных пользователей в фикстурах и globalTeardown
export function readPreparedUsers() {
  if (!fs.existsSync(PREPARED_USERS_PATH)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(PREPARED_USERS_PATH, 'utf-8'));
}

// удаление служебного файла с данными подготовленных пользователей
export function clearPreparedUsers() {
  fs.rmSync(PREPARED_USERS_PATH, { force: true });
}

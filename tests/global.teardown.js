import { request } from '@playwright/test';
import { AuthFacade } from '@/helpers/facades/auth.facade.js';
import { clearCreatedUsersCleanup, getCreatedUsersForCleanup} from '@/helpers/cleanup/users-cleanup.js';
import { getAdminStorageStatePath } from '@/helpers/auth/admin-storage-state.js';

const BASE_URL = process.env.BASE_URL || 'https://calc-dev.v04.dev';
const REMOVE_USER_RETRY_COUNT = 5;

function wait(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

async function removeUserWithRetry(adminApi, userId) {
  let response;

  for (let attempt = 1; attempt <= REMOVE_USER_RETRY_COUNT; attempt += 1) {
    response = await adminApi.removeUser(userId);

    if ([200, 404].includes(response.status())) {
      return response;
    }

    if (response.status() !== 429 || attempt === REMOVE_USER_RETRY_COUNT) {
      break;
    }

    await wait(2000 * attempt);
  }

  return response;
}

export default async function globalTeardown() {
  const userIds = getCreatedUsersForCleanup();

  if (!userIds.length) {
    return;
  }

  const api = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Origin: BASE_URL,
    },
    storageState: getAdminStorageStatePath(),
  });
  const adminApi = new AuthFacade(api);

  try {
    for (const userId of userIds) {
      const response = await removeUserWithRetry(adminApi, userId);

      if (![200, 404].includes(response.status())) {
        console.warn(`Не удалось удалить тестового пользователя ${userId}. Status: ${response.status()}`);
      }
    }

    clearCreatedUsersCleanup();
  } finally {
    await api.dispose();
  }
}

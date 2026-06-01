import { request } from '@playwright/test';
import { AuthFacade } from '@/helpers/facades/auth.facade.js';
import {
  clearCreatedUsersCleanup,
  getCreatedUsersForCleanup,
} from '@/helpers/cleanup/users-cleanup.js';
import { getAdminStorageStatePath } from '@/helpers/auth/admin-storage-state.js';

export default async function globalTeardown() {
  const userIds = getCreatedUsersForCleanup();

  if (!userIds.length) {
    return;
  }

  const api = await request.newContext({
    storageState: getAdminStorageStatePath(),
  });
  const adminApi = new AuthFacade(api);

  try {
    for (const userId of userIds) {
      const response = await adminApi.removeUser(userId);

      if (![200, 404].includes(response.status())) {
        console.warn(`Не удалось удалить тестового пользователя ${userId}. Status: ${response.status()}`);
      }
    }

    clearCreatedUsersCleanup();
  } finally {
    await api.dispose();
  }
}

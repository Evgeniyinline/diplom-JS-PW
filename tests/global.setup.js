import { request } from '@playwright/test';
import { AuthFacade } from '@/helpers/facades/auth.facade.js';
import { ensureAdminStorageStateDir, getAdminStorageStatePath} from '@/helpers/auth/admin-storage-state.js';

const BASE_URL = process.env.BASE_URL || 'https://calc-dev.v04.dev';

export default async function globalSetup() {
  ensureAdminStorageStateDir();

  const api = await request.newContext({
    baseURL: BASE_URL,
  });
  const adminApi = new AuthFacade(api);

  try {
    const { storageState } = await adminApi.authorizeAdminByApi();

    await api.storageState({ path: getAdminStorageStatePath() });

    if (!storageState.cookies.length) {
      throw new Error('Admin storage state does not contain cookies');
    }
  } finally {
    await api.dispose();
  }
}

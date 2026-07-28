import { request } from '@playwright/test';
import { AuthFacade } from '@/helpers/facades/auth.facade.js';
import { SignInEmailBuilder, UserBuilder } from '@/helpers/builders/index.js';
import {
  ensureAdminStorageStateDir,
  getAdminStorageStatePath,
  getEditProfileStorageStatePath,
  getManagerStorageStatePath,
  savePreparedUsers,
} from '@/helpers/auth/admin-storage-state.js';

const BASE_URL = process.env.BASE_URL || 'https://calc-dev.v04.dev';
const USER_CREATE_RETRY_COUNT = 3;

// ожидание перед повторным запросом после rate limit
function wait(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

// создание пользователя с повторными попытками при ответе 429
async function createUserWithRetry(adminApi, user) {
  let response;
  let body;

  for (let attempt = 1; attempt <= USER_CREATE_RETRY_COUNT; attempt += 1) {
    response = await adminApi.createUser(user);
    body = await response.json();

    if (response.ok()) {
      return body.user;
    }

    if (response.status() !== 429 || attempt === USER_CREATE_RETRY_COUNT) {
      throw new Error(`Не удалось создать тестового пользователя. Status: ${response.status()}. Body: ${JSON.stringify(body)}`);
    }

    await wait(2000 * attempt);
  }
}

// авторизация подготовленного пользователя и сохранение его storage state
async function authorizeUser(user, password, storageStatePath) {
  const userRequest = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Origin: BASE_URL,
    },
  });
  const userApi = new AuthFacade(userRequest);

  try {
    const payload = new SignInEmailBuilder()
      .withEmail(user.email)
      .withPassword(password)
      .build();
    const { storageState } = await userApi.authorizeAdminByApi(payload);

    if (!storageState.cookies.length) {
      throw new Error(`Storage state пользователя ${user.email} не содержит cookies`);
    }

    await userRequest.storageState({ path: storageStatePath });
  } finally {
    await userRequest.dispose();
  }
}

export default async function globalSetup() {
  ensureAdminStorageStateDir();

  const api = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Origin: BASE_URL,
    },
  });
  const adminApi = new AuthFacade(api);

  try {
    const { storageState } = await adminApi.authorizeAdminByApi();

    await api.storageState({ path: getAdminStorageStatePath() });

    if (!storageState.cookies.length) {
      throw new Error('Admin storage state does not contain cookies');
    }

    const managerData = new UserBuilder()
      .withEmail()
      .withValidPassword()
      .withUserName()
      .withUserSurname()
      .withRole('manager')
      .build();
    const editProfileData = new UserBuilder()
      .withEmail()
      .withValidPassword()
      .withUserName()
      .withUserSurname()
      .withRole('manager')
      .build();

    const manager = await createUserWithRetry(adminApi, managerData);

    savePreparedUsers({
      manager: {
        ...managerData,
        email: manager.email,
        id: manager.id,
      },
    });

    const editProfileUser = await createUserWithRetry(adminApi, editProfileData);

    const updateUserResponse = await adminApi.updateUser(editProfileUser.id, {
      surname: editProfileData.surname,
    });

    if (!updateUserResponse.ok()) {
      throw new Error(`Не удалось подготовить фамилию пользователя профиля. Status: ${updateUserResponse.status()}`);
    }

    savePreparedUsers({
      manager: {
        ...managerData,
        email: manager.email,
        id: manager.id,
      },
      editProfile: {
        ...editProfileData,
        email: editProfileUser.email,
        id: editProfileUser.id,
      },
    });

    await authorizeUser(manager, managerData.password, getManagerStorageStatePath());
    await authorizeUser(editProfileUser, editProfileData.password, getEditProfileStorageStatePath());
  } finally {
    await api.dispose();
  }
}

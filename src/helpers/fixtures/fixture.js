import { test as base, request as apiRequest } from "@playwright/test";
import { App } from "@/pages/app.page.js";
import { AuthFacade } from "@/helpers/facades/auth.facade.js";
import { SignInEmailBuilder, UserBuilder } from "@/helpers/builders/index.js";
import { addCreatedUsersForCleanup } from "@/helpers/cleanup/users-cleanup.js";
import { getAdminStorageStatePath, readAdminStorageState} from "@/helpers/auth/admin-storage-state.js";

const USER_CREATE_RETRY_COUNT = 3;
const USER_REMOVE_RETRY_COUNT = 5;

function wait(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

async function createUserWithRetry(api, user) {
  let response;
  let body;

  for (let attempt = 1; attempt <= USER_CREATE_RETRY_COUNT; attempt += 1) {
    response = await api.createUser(user);
    body = await response.json();

    if (response.ok()) {
      return { response, body };
    }

    if (response.status() !== 429 || attempt === USER_CREATE_RETRY_COUNT) {
      break;
    }

    await wait(2000 * attempt);
  }

  return { response, body };
}

async function removeUserWithRetry(api, userId) {
  let response;

  for (let attempt = 1; attempt <= USER_REMOVE_RETRY_COUNT; attempt += 1) {
    response = await api.removeUser(userId);

    if ([200, 404].includes(response.status())) {
      return response;
    }

    if (response.status() !== 429 || attempt === USER_REMOVE_RETRY_COUNT) {
      break;
    }

    await wait(1000 * attempt);
  }

  return response;
}

export const test = base.extend({

// менеджер создаётся один раз на worker и переиспользуется в UI-тестах
  managerStorageState: [async ({}, use, workerInfo) => {
    const baseURL = workerInfo.project.use.baseURL;
    const adminRequest = await apiRequest.newContext({
      baseURL,
      extraHTTPHeaders: {
        Origin: baseURL,
      },
      storageState: getAdminStorageStatePath(),
    });
    const managerRequest = await apiRequest.newContext({
      baseURL,
      extraHTTPHeaders: {
        Origin: baseURL,
      },
    });
    const adminApi = new AuthFacade(adminRequest);
    const managerApi = new AuthFacade(managerRequest);
    let managerId;

    try {
      const manager = new UserBuilder()
        .withEmail()
        .withValidPassword()
        .withUserName()
        .withUserSurname()
        .withRole('manager')
        .build();

      const { response: createResponse, body: createBody } = await createUserWithRetry(adminApi, manager);

      if (!createResponse.ok()) {
        throw new Error(`Не удалось создать менеджера. Status: ${createResponse.status()}. Body: ${JSON.stringify(createBody)}`);
      }

      managerId = createBody.user.id;

      const payload = new SignInEmailBuilder()
        .withEmail(createBody.user.email)
        .withPassword(manager.password)
        .build();

      const { storageState } = await managerApi.authorizeAdminByApi(payload);

      await use(storageState);
    } finally {
      if (managerId) {
        const removeResponse = await removeUserWithRetry(adminApi, managerId);

        if (![200, 404].includes(removeResponse.status())) {
          console.warn(`Не удалось удалить менеджера ${managerId}. Status: ${removeResponse.status()}`);
        }
      }

      await managerRequest.dispose();
      await adminRequest.dispose();
    }
  }, { scope: 'worker' }],

  // открытие стартовой страницы
  app: async ({page}, use) => {
    const app = new App(page);
    await app.authPage.openAuthPage();
    await use(app);
  },

 // для API-тестов авторизации
  authApi: async ({request}, use) => {
    const authApi = new AuthFacade(request);
    await use(authApi);
  },

// для UI-тестов, где нужен уже авторизованный админ
  adminApp: async ({page}, use) => {
    const storageState = readAdminStorageState();

    await page.context().addCookies(storageState.cookies);

    const app = new App(page);
    await use(app);
  },

// для UI-тестов, где нужен уже авторизованный менеджер
  managerApp: async ({page, managerStorageState}, use) => {
    await page.context().addCookies(managerStorageState.cookies);

    const app = new App(page);
    await use(app);
  },
  
// для API-тестов, где нужен админ
  adminApi: async ({}, use, testInfo) => {
    const baseURL = testInfo.project.use.baseURL;
    const adminRequest = await apiRequest.newContext({
      baseURL,
      extraHTTPHeaders: {
        Origin: baseURL,
      },
      storageState: getAdminStorageStatePath(),
    });
    const adminApi = new AuthFacade(adminRequest);
    const createdUserIds = [];

    const createUser = adminApi.createUser.bind(adminApi);

    adminApi.createUser = async (...args) => {
      const response = await createUser(...args);

      if (response.ok()) {
        const body = await response.json();

        if (body.user?.id) {
          createdUserIds.push(body.user.id);
        }
      }

      return response;
    };

    try {
      await use(adminApi);

      if (testInfo.status === testInfo.expectedStatus) {
        addCreatedUsersForCleanup(testInfo, createdUserIds);
      }
    } finally {
      await adminRequest.dispose();
    }
  },
  
}); 

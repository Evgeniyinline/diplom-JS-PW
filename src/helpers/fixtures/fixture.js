import { test as base, request as apiRequest } from "@playwright/test";
import { App } from "@/pages/app.page.js";
import { AuthFacade } from "@/helpers/facades/auth.facade.js";
import { ProfileFacade } from "@/helpers/facades/profile.facade.js";
import { ProposalsFacade } from "@/helpers/facades/proposals.facade.js";
import { addCreatedUsersForCleanup } from "@/helpers/cleanup/users-cleanup.js";
import {
  getAdminStorageStatePath,
  getEditProfileStorageStatePath,
  getManagerStorageStatePath,
  readAdminStorageState,
  readEditProfileStorageState,
  readManagerStorageState,
  readPreparedUsers,
} from "@/helpers/auth/admin-storage-state.js";

export const test = base.extend({

// storage менеджера готовится один раз в globalSetup и переиспользуется worker'ами
  managerStorageState: [async ({}, use) => {
    await use(readManagerStorageState());
  }, { scope: 'worker' }],

  // API-контекст менеджера использует storage, подготовленный в globalSetup
  proposalsApi: [async ({}, use, workerInfo) => {
    const managerRequest = await apiRequest.newContext({
      baseURL: workerInfo.project.use.baseURL,
      extraHTTPHeaders: {
        Origin: workerInfo.project.use.baseURL,
      },
      storageState: getManagerStorageStatePath(),
    });

    try {
      await use(new ProposalsFacade(managerRequest));
    } finally {
      await managerRequest.dispose();
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

  // пользователь и storage профиля готовятся один раз в globalSetup
  editProfileApi: [async ({}, use, workerInfo) => {
    const baseURL = workerInfo.project.use.baseURL;
    const adminRequest = await apiRequest.newContext({
      baseURL,
      extraHTTPHeaders: {
        Origin: baseURL,
      },
      storageState: getAdminStorageStatePath(),
    });
    const userRequest = await apiRequest.newContext({
      baseURL,
      extraHTTPHeaders: {
        Origin: baseURL,
      },
      storageState: getEditProfileStorageStatePath(),
    });
    const adminApi = new AuthFacade(adminRequest);
    const profileApi = new ProfileFacade(userRequest);
    const { editProfile: user } = readPreparedUsers();

    try {
      await use({
        adminApi,
        profileApi,
        storageState: readEditProfileStorageState(),
        user,
      });
    } finally {
      await userRequest.dispose();
      await adminRequest.dispose();
    }
  }, { scope: 'worker' }],

  // UI-обёртка над editProfileApi: добавляет авторизованную страницу и App
  editProfileApp: async ({page, editProfileApi}, use) => {
    await page.context().addCookies(editProfileApi.storageState.cookies);

    const app = new App(page);

    await use({
      ...editProfileApi,
      app,
    });
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

import { test as base, request as apiRequest } from "@playwright/test";
import { App } from "../../pages/app.page.js";
import { AuthFacade } from "@/helpers/facades/auth.facade.js";
import { SignInEmailBuilder } from "@/helpers/builders/auth.builder.js";
import { UserBuilder } from "@/helpers/builders/user.builder.js";
import { addCreatedUsersForCleanup } from "@/helpers/cleanup/users-cleanup.js";
import { getAdminStorageStatePath, readAdminStorageState} from "@/helpers/auth/admin-storage-state.js";

export const test = base.extend({

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
  managerApp: async ({page}, use, testInfo) => {
    const managerPassword = 'Test123456!';
    const adminRequest = await apiRequest.newContext({
      storageState: getAdminStorageStatePath(),
    });
    const managerRequest = await apiRequest.newContext();
    const adminApi = new AuthFacade(adminRequest);
    const managerApi = new AuthFacade(managerRequest);
    let managerId;

    try {
      const manager = new UserBuilder()
        .withEmail()
        .withPassword(managerPassword)
        .withUserName()
        .withUserSurname()
        .withRole('manager')
        .build();

      const createResponse = await adminApi.createUser(manager);
      const createBody = await createResponse.json();

      managerId = createBody.user.id;

      const payload = new SignInEmailBuilder()
        .withEmail(createBody.user.email)
        .withPassword(managerPassword)
        .build();

      await managerApi.authorizeByApi(page.context(), payload);

      const app = new App(page);
      await use(app);
    } finally {
      if (managerId && testInfo.status === testInfo.expectedStatus) {
        addCreatedUsersForCleanup(testInfo, [managerId]);
      }

      await managerRequest.dispose();
      await adminRequest.dispose();
    }
  },
  
// для API-тестов, где нужен админ
  adminApi: async ({}, use, testInfo) => {
    const adminRequest = await apiRequest.newContext({
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

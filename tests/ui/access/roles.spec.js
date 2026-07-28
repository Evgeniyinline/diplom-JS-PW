import { expect } from "@playwright/test";
import { test } from '@/helpers/fixtures/fixture.js'

test.describe('Role access UI', () => {

  test('Админ видит все разделы навигации', async ({ page, adminApp }) => {
    await adminApp.openProposalPage();

    await expect(page).toHaveURL(/\/proposals$/);
    await expect(adminApp.headerComponent.getNameProposalsPage()).toBeVisible();
    await expect(adminApp.headerComponent.getNameCalcPage()).toBeVisible();
    await expect(adminApp.headerComponent.getNameNomenclaturesPage()).toBeVisible();
    await expect(adminApp.headerComponent.getNameUsersPage()).toBeVisible();

  });

  test('Менеджер видит только раздел Предложения', async ({ page, managerApp }) => {
    await managerApp.openProposalPage();

    await expect(page).toHaveURL(/\/proposals$/);
    await expect(managerApp.headerComponent.getNameProposalsPage()).toBeVisible();
    await expect(managerApp.headerComponent.getNameCalcPage()).not.toBeVisible();
    await expect(managerApp.headerComponent.getNameNomenclaturesPage()).not.toBeVisible();
    await expect(managerApp.headerComponent.getNameUsersPage()).not.toBeVisible();

  });

  // Проверяет защиту административных маршрутов от прямого открытия пользователем с ролью manager.
  test('Менеджер не может открыть административные страницы по прямой ссылке', async ({ page, managerApp }) => {
    
    for (const adminPath of ['/users', '/nomenclatures', '/calculator-settings']) {
      await page.goto(adminPath);

      await expect(page).toHaveURL(/\/proposals$/);
      await expect(managerApp.headerComponent.getNameUsersPage()).not.toBeVisible();
      await expect(managerApp.headerComponent.getNameNomenclaturesPage()).not.toBeVisible();
      await expect(managerApp.headerComponent.getNameCalcPage()).not.toBeVisible();

    }
    
  });

});

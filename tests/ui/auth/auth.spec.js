import { expect } from "@playwright/test";
import { test } from '@/helpers/fixtures/fixture.js'

import { App } from "@/pages/app.page.js";
import { UserBuilder } from "@/helpers/builders/user.builder.js";


// Открытие страницы / работоспособность
test('Визуальная проверка страницы авторизации', async ({ page }) => {
  const app = new App(page);
  await app.authPage.openAuthPage();
  
  await expect(app.authPage.getTitle()).toBeVisible();

});

// неверные логин/пароль
test('wrong credentials', async ({ page }) => {
  const app = new App(page);
  const user = new UserBuilder().withEmail().withPassword().build();

  await app.authPage.openAuthPage();
  await app.authPage.signInWithInvalidData(user);
  
  await expect(app.authPage.getErrorMessage()).toBeVisible();

});

// пустое состояние
test('пустое состояние авторизации', async ({ page }) => {
  const app = new App(page);

  await app.authPage.openAuthPage();
  await app.authPage.signInWithEmptyData();

  await expect(app.authPage.getErrorMessageEmail()).toBeVisible();
  await expect(app.authPage.getErrorMessagePassword()).toBeVisible();

});

// авторизация/выход из лк
test('авторизация/выход из лк', async ({ page }) => {
  const app = new App(page);
  

  await app.authPage.openAuthPage();
  await app.authPage.signInStaticUser();


  await expect(app.authPage.getTitle()).toBeVisible();
  await expect(page).toHaveURL('https://calc-dev.v04.dev/proposals');

});

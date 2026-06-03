import { expect } from "@playwright/test";
import { test } from '@/helpers/fixtures/fixture.js'

import { SignInEmailBuilder, UserBuilder } from "@/helpers/builders/index.js";


// Открытие страницы / работоспособность
test('Визуальная проверка страницы авторизации', async ({ app }) => {
  await expect(app.authPage.getTitle()).toBeVisible();

});

// неверные логин/пароль
test('Авторизация с неверными данными показывает ошибку', async ({ app }) => {
  const user = new UserBuilder().withEmail().withPassword().build();

  await app.authPage.signInWithInvalidData(user);
  
  await expect(app.authPage.getErrorMessage()).toBeVisible();

});

// пустое состояние
test('Пустая форма авторизации показывает ошибки валидации', async ({ app }) => {
  await app.authPage.signInWithEmptyData();

  await expect(app.authPage.getErrorMessageEmail()).toBeVisible();
  await expect(app.authPage.getErrorMessagePassword()).toBeVisible();

});

// авторизация
test('Авторизация с корректными данными перенаправляет на страницу КП', async ({ app }) => {
  const user = new SignInEmailBuilder().build();

  await app.authPage.signIn(user);

  await expect(app.page).toHaveURL(/\/proposals$/);
});

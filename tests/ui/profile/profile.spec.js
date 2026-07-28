import { resolve } from 'node:path';
import { expect } from '@playwright/test';
import { test } from '@/helpers/fixtures/fixture.js';
import { UserBuilder } from '@/helpers/builders/index.js';

const AVATAR_PATH = resolve(process.cwd(), 'test-data/profile/avatar.png');
const SIGNATURE_PATH = resolve(process.cwd(), 'test-data/profile/signature.png');

test.describe.serial('Profile UI', () => {
  test('Страница профиля открывается', async ({ adminApp }) => {
    await adminApp.openProfilePage();

    await expect(adminApp.page).toHaveURL(/\/profile$/);
    await expect(adminApp.profilePage.profilePage).toBeVisible();
    await expect(adminApp.profilePage.pageTitle).toHaveText('Профиль');
    await expect(adminApp.profilePage.personalDataTab).toHaveAttribute('aria-selected', 'true');
  });

  test('В профиле отображаются данные пользователя', async ({ editProfileApp }) => {
    const { adminApi, app, user } = editProfileApp;
    const personalData = new UserBuilder()
      .withUserName()
      .withUserSurname()
      .buildPersonalData();

    const updateResponse = await adminApi.updateUser(user.id, personalData);

    expect(updateResponse.status()).toBe(200);

    await app.openProfilePage();

    await expect(app.profilePage.nameInput).toHaveValue(personalData.name);
    await expect(app.profilePage.surnameInput).toHaveValue(personalData.surname);
    await expect(app.profilePage.emailInput).toHaveValue(user.email);
    await expect(app.profilePage.emailInput).toBeDisabled();
  });

  test('Пользователь редактирует личные данные и изображения', async ({ editProfileApp }) => {
    const { app } = editProfileApp;
    const updatedUser = new UserBuilder()
      .withUserName()
      .withUserSurname()
      .buildPersonalData();

    await app.openProfilePage();

    await app.profilePage.nameInput.fill('');
    await app.profilePage.savePersonalData();

    const isNameValid = await app.profilePage.nameInput.evaluate((input) => input.checkValidity());

    expect(isNameValid).toBe(false);

    await app.profilePage.updatePersonalData(updatedUser);
    await expect(app.profilePage.nameInput).toHaveValue(updatedUser.name);
    await expect(app.profilePage.surnameInput).toHaveValue(updatedUser.surname);

    await app.profilePage.uploadAvatar(AVATAR_PATH);
    await app.profilePage.uploadSignature(SIGNATURE_PATH);

    await expect(app.profilePage.avatarImage).toBeVisible();
    await expect(app.profilePage.signatureImage).toBeVisible();

    const uploadedAvatar = await app.profilePage.avatarImage.getAttribute('src');
    const uploadedSignature = await app.profilePage.signatureImage.getAttribute('src');

    await app.page.reload();

    await expect(app.profilePage.nameInput).toHaveValue(updatedUser.name);
    await expect(app.profilePage.surnameInput).toHaveValue(updatedUser.surname);
    await expect(app.profilePage.avatarImage).toHaveAttribute('src', uploadedAvatar);
    await expect(app.profilePage.signatureImage).toHaveAttribute('src', uploadedSignature);

    await app.profilePage.avatarDeleteButton.click();
    await app.profilePage.signatureDeleteButton.click();

    await expect(app.profilePage.avatarImage).not.toBeVisible();
    await expect(app.profilePage.signatureImage).not.toBeVisible();
  });
});

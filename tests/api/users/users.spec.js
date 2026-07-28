import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect } from '@playwright/test';
import { test } from '@/helpers/fixtures/fixture.js';
import { UserBuilder } from '@/helpers/builders/index.js';

const AVATAR_PATH = resolve(process.cwd(), 'test-data/profile/avatar.png');
const SIGNATURE_PATH = resolve(process.cwd(), 'test-data/profile/signature.png');


  test('@PUT @GET Обновить личные данные пользователя', async ({ editProfileApi }) => {
    const { adminApi, user } = editProfileApi;
    const personalData = new UserBuilder()
      .withUserName()
      .withUserSurname()
      .build();

    const updateResponse = await adminApi.updateUser(user.id, personalData);

    expect(updateResponse.status()).toBe(200);

    const getResponse = await adminApi.getUser(user.id);
    const updatedUser = await getResponse.json();

    expect(getResponse.status()).toBe(200);
    expect(updatedUser.name).toBe(personalData.name);
    expect(updatedUser.surname).toBe(personalData.surname);
  });

  test('@PUT Пустое имя не проходит валидацию', async ({ editProfileApi }) => {
    const { adminApi, user } = editProfileApi;

    const response = await adminApi.updateUser(user.id, {
      name: '',
    });

    expect(response.status()).toBe(400);
  });

  test('@PUT @GET Обновить профиль менеджера', async ({ editProfileApi }) => {
    const { profileApi } = editProfileApi;
    const managerProfile = new UserBuilder()
      .withPosition()
      .withPhone()
      .withContactEmail()
      .withShowInPdf()
      .buildProfile();

    const updateResponse = await profileApi.updateProfile(managerProfile);

    expect(updateResponse.status()).toBe(200);

    const getResponse = await profileApi.getProfile();
    const updatedProfile = await getResponse.json();

    expect(getResponse.status()).toBe(200);
    expect(updatedProfile).toEqual(managerProfile);
  });

  test('@POST @GET @DELETE Загрузить и удалить аватар и подпись', async ({ editProfileApi }) => {
    const { profileApi } = editProfileApi;

    const avatarResponse = await profileApi.uploadAvatar({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: readFileSync(AVATAR_PATH),
    });
    const signatureResponse = await profileApi.uploadSignature({
      name: 'signature.png',
      mimeType: 'image/png',
      buffer: readFileSync(SIGNATURE_PATH),
    });

    expect(avatarResponse.status()).toBe(200);
    expect(signatureResponse.status()).toBe(200);

    const getAvatarResponse = await profileApi.getAvatar();
    const getSignatureResponse = await profileApi.getSignature();

    expect(getAvatarResponse.status()).toBe(200);
    expect(getSignatureResponse.status()).toBe(200);
    expect((await getAvatarResponse.json()).url).toBeTruthy();
    expect((await getSignatureResponse.json()).url).toBeTruthy();

    const deleteAvatarResponse = await profileApi.deleteAvatar();
    const deleteSignatureResponse = await profileApi.deleteSignature();

    expect(deleteAvatarResponse.status()).toBe(200);
    expect(deleteSignatureResponse.status()).toBe(200);
  });

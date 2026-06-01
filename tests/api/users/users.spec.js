import { expect } from '@playwright/test';
import { test } from '@/helpers/fixtures/fixture.js';
import { UserBuilder } from '@/helpers/builders/user.builder.js';

test.describe('Users API', () => {
// создание нового пользователя через API
 test('@POST Создать нового пользователя через API', async ({ adminApi }) => {
    const user = new UserBuilder()
      .withEmail()
      .withPassword('Test123456!')
      .withUserName()
      .withUserSurname()
      .withRole('manager')
      .build();

    const response = await adminApi.createUser(user);

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.user).toHaveProperty('id');
    expect(body.user.email).toBe(user.email.toLowerCase());
    expect(body.user.role).toBe(user.role);
    expect(body.user.name).toBe(user.name);
    
  });
// получение пользователя через API
 test('@POST @GET Получить пользователя через API', async ({ adminApi }) => {
    const user = new UserBuilder()
      .withEmail()
      .withPassword('Test123456!')
      .withUserName()
      .withUserSurname()
      .withRole('manager')
      .build();

    const createResponse = await adminApi.createUser(user);

    expect(createResponse.status()).toBe(200);

    const createBody = await createResponse.json();
    const userId = createBody.user.id;

    const getResponse = await adminApi.getUser(userId);

    expect(getResponse.status()).toBe(200);

    const getBody = await getResponse.json();

    expect(getBody.id).toBe(userId);
    expect(getBody.email).toBe(user.email.toLowerCase());
    expect(getBody.role).toBe(user.role);
    expect(getBody.name).toBe(user.name);

  });
// обновление роли пользователя через API
 test('@POST @PUT @GET Обновить роль пользователя через API', async ({ adminApi }) => {
    const user = new UserBuilder()
      .withEmail()
      .withPassword('Test123456!')
      .withUserName()
      .withUserSurname()
      .withRole('manager')
      .build();

    const createResponse = await adminApi.createUser(user);

    expect(createResponse.status()).toBe(200);

    const createBody = await createResponse.json();
    const userId = createBody.user.id;

    const updateResponse = await adminApi.updateUser(userId, {
      role: 'admin',
    });

    expect(updateResponse.status()).toBe(200);

    const updateBody = await updateResponse.json();

    expect(updateBody.success).toBe(true);

    const getResponse = await adminApi.getUser(userId);

    expect(getResponse.status()).toBe(200);

    const getBody = await getResponse.json();

    expect(getBody.id).toBe(userId);
    expect(getBody.role).toBe('admin');

    const updateToManagerResponse = await adminApi.updateUser(userId, {
      role: 'manager',
    });

    expect(updateToManagerResponse.status()).toBe(200);

    const updateToManagerBody = await updateToManagerResponse.json();

    expect(updateToManagerBody.success).toBe(true);

    const getUpdatedUserResponse = await adminApi.getUser(userId);

    expect(getUpdatedUserResponse.status()).toBe(200);

    const getUpdatedUserBody = await getUpdatedUserResponse.json();

    expect(getUpdatedUserBody.id).toBe(userId);
    expect(getUpdatedUserBody.role).toBe('manager');

  });
// удаление пользователя через API
 test('@POST @GET @DELETE Удалить пользователя через API', async ({ adminApi }) => {
    const user = new UserBuilder()
      .withEmail()
      .withPassword('Test123456!')
      .withUserName()
      .withUserSurname()
      .withRole('manager')
      .build();

    const createResponse = await adminApi.createUser(user);

    expect(createResponse.status()).toBe(200);

    const createBody = await createResponse.json();
    const userId = createBody.user.id;

    expect(createBody.user).toHaveProperty('id');
    expect(createBody.user.email).toBe(user.email.toLowerCase());
    expect(createBody.user.role).toBe(user.role);
    expect(createBody.user.name).toBe(user.name);

    const removeResponse = await adminApi.removeUser(userId);

    expect(removeResponse.status()).toBe(200);

    const removeBody = await removeResponse.json();

    expect(removeBody.success).toBe(true);

    const getDeletedUserResponse = await adminApi.getUser(userId);

    expect(getDeletedUserResponse.status()).toBe(404);

    const getDeletedUserBody = await getDeletedUserResponse.json();

    expect(getDeletedUserBody.error).toBe('User not found');

  });
});

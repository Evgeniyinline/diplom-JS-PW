import { expect } from '@playwright/test';
import { test } from '@/helpers/fixtures/fixture.js';
import { SignInEmailBuilder } from '@/helpers/builders/index.js';

test.describe('Auth API', () => {
// получение админского токена через API
  test('@POST @GET Получить админский токен через API', async ({ authApi }) => {
    const payload = new SignInEmailBuilder().build();

    const authState = await authApi.authorizeAdminByApi(payload);

    expect(authState.sessionCookie.name).toBe('better-auth.session_token');

    const sessionResponse = await authApi.getSession();

    expect(sessionResponse.status()).toBe(200);

    const sessionBody = await sessionResponse.json();

    expect(sessionBody).toBeTruthy();
    expect(sessionBody.user).toBeTruthy();
    expect(sessionBody.user.email).toBe(payload.email);

  });

});

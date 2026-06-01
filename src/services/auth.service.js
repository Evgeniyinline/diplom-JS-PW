import { expect } from "@playwright/test";
import { AuthController, BASE_URL } from "@/controllers/auth.controller.js";
import { SignInEmailBuilder } from "@/helpers/builders/auth.builder.js";

const AUTH_COOKIE_NAME = "better-auth.session_token";

export class AuthService {
  constructor(request) {
    this.authController = new AuthController(request);
  }

  async authorizeAdmin(payload = new SignInEmailBuilder().build()) {
    const response = await this.authController.signInEmail(payload);

    const responseBody = response.ok() ? '' : await response.text();

    expect(
      response.ok(),
      `Admin auth failed. Status: ${response.status()}. Body: ${responseBody}`
    ).toBeTruthy();

    const storageState = await this.authController.getStorageState();
    const sessionCookie = storageState.cookies.find(
      (cookie) => cookie.name === AUTH_COOKIE_NAME
    );

    expect(sessionCookie).toBeTruthy();

    return {
      storageState,
      sessionCookie,
    };
  }

  async authorizeUiContext(context, payload = new SignInEmailBuilder().build()) {
    const { storageState } = await this.authorizeAdmin(payload);

    await context.addCookies(storageState.cookies);
  }

  async getSession() {
    return this.authController.getSession();
  }
}

export async function authorizeByApi(request, context) {
  const authService = new AuthService(request);
  await authService.authorizeUiContext(context);
}

export { BASE_URL };

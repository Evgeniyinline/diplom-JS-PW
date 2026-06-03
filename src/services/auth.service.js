import { AuthController } from "@/controllers/auth.controller.js";
import { SignInEmailBuilder } from "@/helpers/builders/index.js";

const AUTH_COOKIE_NAME = "better-auth.session_token";

export class AuthService {
  constructor(request) {
    this.authController = new AuthController(request);
  }

  async authorizeAdmin(payload = new SignInEmailBuilder().build()) {
    const response = await this.authController.signInEmail(payload);

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Admin auth failed. Status: ${response.status()}. Body: ${body}`);
    }

    const storageState = await this.authController.getStorageState();
    const sessionCookie = storageState.cookies.find(
      (cookie) => cookie.name === AUTH_COOKIE_NAME
    );

    if (!sessionCookie) {
      throw new Error(`Admin auth failed. Cookie ${AUTH_COOKIE_NAME} was not found`);
    }

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

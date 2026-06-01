const BASE_URL = "https://calc-dev.v04.dev";

export class AuthController {
  constructor(request) {
    this.request = request;
  }

  async signInEmail(payload) {
    return this.request.post(`${BASE_URL}/api/auth/sign-in/email`, {
      data: payload,
    });
  }

  async getSession() {
    return this.request.get(`${BASE_URL}/api/auth/get-session`);

  }

    async getStorageState() {
      return this.request.storageState();
  }
}

export { BASE_URL };

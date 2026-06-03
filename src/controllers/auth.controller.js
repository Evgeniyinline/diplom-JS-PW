export class AuthController {
  constructor(request) {
    this.request = request;
  }

  async signInEmail(payload) {
    return this.request.post('/api/auth/sign-in/email', {
      data: payload,
    });
  }

  async getSession() {
    return this.request.get('/api/auth/get-session');

  }

    async getStorageState() {
      return this.request.storageState();
  }
}

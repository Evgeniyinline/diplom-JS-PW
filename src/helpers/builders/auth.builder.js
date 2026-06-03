export class SignInEmailBuilder {
  constructor() {
    this.callbackURL = "/proposals";
    this.email = process.env.E2E_EMAIL;
    this.password = process.env.E2E_PASSWORD;
  }

  withCallbackURL(callbackURL) {
    this.callbackURL = callbackURL;
    return this;
  }

  withEmail(email) {
    this.email = email;
    return this;
  }

  withPassword(password) {
    this.password = password;
    return this;
  }

  build() {
    if (!this.email || !this.password) {
      throw new Error('E2E_EMAIL and E2E_PASSWORD must be set');
    }

    return {
      callbackURL: this.callbackURL,
      email: this.email,
      password: this.password,
    };
  }
}

export class SignInEmailBuilder {
  constructor() {
    this.callbackURL = "/proposals";
    this.email = process.env.E2E_EMAIL || "eorlov@o2xygen.ru";
    this.password = process.env.E2E_PASSWORD || "eorlov@o2xygen.ru";
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
    return {
      callbackURL: this.callbackURL,
      email: this.email,
      password: this.password,
    };
  }
}

export class AuthPage {

  // элементы страницы


  constructor (page) {
    this.page = page;

    this.logo = page.getByTestId('login-page-logo');
    this.title = page.locator('h2');
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.loginButton = page.getByTestId('login-submit-button');
    this.errorMessageEmail = page.getByText('Неверный email');
    this.errorMessagePassword = page.getByText('Пароль должен быть не менее 5 символов');
    this.errorMessage = page.getByText('Invalid email or password');

  }
  // авторизация пользователя
  async signIn (user) {
    const {email, password} = user;
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();

  }

  // авторизация с не верными данными
  async signInWithInvalidData (user) {
    await this.signIn(user);
  }
  // пустая авторизация
  async signInWithEmptyData () {
    await this.loginButton.click();
  }

  // получение ошибки авторизации
  getErrorMessageEmail () {
    return this.errorMessageEmail;

  }
  getErrorMessagePassword () {
    return this.errorMessagePassword;
  }

  getTitle () {
    return this.title;
  }
  getErrorMessage () {
    return this.errorMessage;
  }

  // открытие страницы авторизации
  async openAuthPage () {
    await this.page.goto('/auth');

  }

}

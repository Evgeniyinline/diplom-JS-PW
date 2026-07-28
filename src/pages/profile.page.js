export class ProfilePage {

  constructor(page) {
    
    this.page = page;

    this.profilePage = page.getByTestId('profile-page');
    this.pageTitle = page.getByRole('heading', { name: 'Профиль' });

    this.personalDataTab = page.getByTestId('profile-tab-personal');
    this.appearanceTab = page.getByTestId('profile-tab-appearance');
    this.securityTab = page.getByTestId('profile-tab-security');

    this.avatarImage = page.getByRole('img', { name: 'Аватар' });
    this.avatarUploadInput = page.locator('input[type="file"][accept="image/png,image/jpeg,image/webp"]');
    this.avatarActions = this.avatarUploadInput.locator('..').locator('..');
    this.avatarDeleteButton = this.avatarActions.getByRole('button', { name: 'Удалить' });

    this.signatureImage = page.getByRole('img', { name: 'Подпись' });
    this.signatureUploadInput = page.locator('input[type="file"][accept="image/png"]');
    this.signatureActions = this.signatureUploadInput.locator('..').locator('..');
    this.signatureDeleteButton = this.signatureActions.getByRole('button', { name: 'Удалить' });

    this.personalDataForm = page.getByTestId('profile-data-form');
    this.nameInput = page.getByTestId('profile-name-input');
    this.surnameInput = page.getByTestId('profile-surname-input');
    this.emailInput = page.getByTestId('profile-email-input');
    this.savePersonalDataButton = page.getByTestId('profile-save-button');

    this.managerForm = page.getByTestId('profile-manager-form');
    this.positionInput = page.getByTestId('profile-position-input');
    this.contactTypeSelects = page.locator('[data-testid^="contact-type-"]');
    this.contactLabelInputs = page.locator('[data-testid^="contact-label-"]');
    this.contactValueInputs = page.locator('[data-testid^="contact-value-"]');
    this.contactRemoveButtons = page.locator('[data-testid^="contact-remove-"]');
    this.addContactButton = page.getByTestId('contact-add');
    this.showManagerInPdfCheckbox = page.getByTestId('profile-show-in-pdf');
    this.managerPreview = page.getByTestId('profile-manager-preview');
    this.saveManagerButton = page.getByTestId('profile-manager-save-button');

    this.systemThemeButton = page.getByTestId('theme-mode-system');
    this.lightThemeButton = page.getByTestId('theme-mode-light');
    this.darkThemeButton = page.getByTestId('theme-mode-dark');


    // TODO: эксперимент ui диз

    // this.accentColorButtons = {
    //   blue: page.getByTestId('accent-color-blue'),
    //   green: page.getByTestId('accent-color-green'),
    //   violet: page.getByTestId('accent-color-violet'),
    //   orange: page.getByTestId('accent-color-orange'),
    //   rose: page.getByTestId('accent-color-rose'),
    //   amber: page.getByTestId('accent-color-amber'),
    //   teal: page.getByTestId('accent-color-teal'),
    //   indigo: page.getByTestId('accent-color-indigo'),
    //   pink: page.getByTestId('accent-color-pink'),
    //   cyan: page.getByTestId('accent-color-cyan'),
    // };

    this.revokeOtherSessionsButton = page.getByTestId('profile-sessions-revoke-others');
    this.currentPasswordInput = page.getByTestId('profile-password-current-input');
    this.newPasswordInput = page.getByTestId('profile-password-new-input');
    this.confirmPasswordInput = page.getByTestId('profile-password-confirm-input');
    this.revokeOtherSessionsCheckbox = page.getByTestId('profile-password-revoke-others');
    this.changePasswordButton = page.getByTestId('profile-password-submit-button');

  }

  // открытие страницы профиля
  async openProfilePage() {
    await this.page.goto('/profile');
  }

  // заполнение имени и фамилии пользователя
  async fillPersonalData(profile) {
    await this.nameInput.fill(profile.name);
    await this.surnameInput.fill(profile.surname);
  }

  // сохранение формы личных данных
  async savePersonalData() {
    await this.savePersonalDataButton.click();
  }

  // полный шаг изменения и сохранения личных данных
  async updatePersonalData(profile) {
    await this.fillPersonalData(profile);
    await this.savePersonalData();
  }

  // загрузка аватара через скрытый input
  async uploadAvatar(filePath) {
    await this.avatarUploadInput.setInputFiles(filePath);
  }

  // загрузка подписи через скрытый input
  async uploadSignature(filePath) {
    await this.signatureUploadInput.setInputFiles(filePath);
  }

}

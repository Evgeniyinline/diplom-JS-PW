export class ProposalPage {

  // страница Мои КП

  constructor (page) {
    this.page = page;

    this.searchButton = page.getByTitle('Поиск');
    this.searchInput = page.getByPlaceholder('Поиск по названию...');
    this.createButton = page.getByRole("button", { name: 'Создать КП' });
    this.nameInput = page.getByPlaceholder('Например: КП для ООО Рога и Копыта')
    this.calculatorSelect = page.locator('[role="combobox"]');
    this.createProposalModal = page.getByRole('dialog');
    this.proposalsList = page.getByTestId('proposals-list');
    this.calculatorSelect = page.getByText('Выберите калькулятор');
    this.submitCreateButton = this.createProposalModal.getByRole('button', { name: 'Создать' });
    this.proposalRows = page.locator('[data-testid^="proposal-row-"]');

  }

  async clickSearchButton () {
    await this.searchButton.click();
  }
  async searchOrder (name) {
    await this.clickSearchButton();
    await this.searchInput.fill(name);

  }

  getSearchResult () {
    return this.emptyComponent.getSearchResult();
  }


  async clearSearch() {
    await this.clickSearchButton();
  }

  async getProposalsCount () {
    return await this.proposalsList.count();
  }

  // открыть модалку создания

  async openCreateProposalModal() {
    await this.createButton.click();

  }

  // выбрать калькулятор

  async selectCalculator(calculatorName) {
    await this.calculatorSelect.click();
    await this.page.getByRole('option', { name: calculatorName }).click();

  }
  // создание КП

  async createProposal({ proposalName, calculatorName }) {
    await this.openCreateProposalModal();
    await this.nameInput.fill(proposalName);
    await this.selectCalculator(calculatorName);
    await this.submitCreateButton.click();

  }

  // getProposalByName(proposalName) {
  //   return this.page.getByText(proposalName);

  // }

  getProposalByName(proposalName) {
  return this.proposalRows.filter({ hasText: proposalName });
}

  async openProposalByName(proposalName) {
    await this.getProposalByName(proposalName).click();

  }

  getCurrency() {
    return this.page.getByText(/RUB|KZT|UZS|EUR/);

  }

  getOpenedProposalTitle(proposalName) {
  return this.page.getByRole('heading', {
    name: proposalName,
  });
}




    // this.navigate = page.locator('nav');
    // this.calcProLink = page.getByTestId('pro-calculator-content');
    // this.calcBaseLink = page.getByTestId('base-calculator-content');
    // this.analyticsLink = page.getByTestId('analytics-content');
    // this.nomenclaturesLink = page.getByTestId('nomenclatures-content');
    // this.usersLink = page.getByTestId('users-content');
    // this.profileDropdown = page.getByTestId('profile-dropdown');
    // this.profileLink = page.getByTestId('profile-content');
    // this.signoutLink = page.getByTestId('signout-content');
    // this.switchConfirmLink = page.getByTestId('base-calculator-switch-confirm-continue');
    // TODO: закончить реализацию

}

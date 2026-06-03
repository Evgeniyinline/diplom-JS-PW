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
    return await this.proposalRows.count();
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

  getProposalByName(proposalName) {
  return this.proposalRows.filter({ hasText: proposalName });
}

  async openProposalByName(proposalName) {
    await this.getProposalByName(proposalName).click();

  }

  getCurrency(currency) {
    return this.page.getByText(currency ?? /RUB|KZT|UZS|EUR/);

  }

  getOpenedProposalTitle(proposalName) {
  return this.page.getByRole('heading', {
    name: proposalName,
  });
  }
}

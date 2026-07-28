import { CreateProposalComponent } from "@/components/index.js";

export class ProposalPage {

  // страница Мои КП

  constructor (page) {
    this.page = page;

    this.searchButton = page.getByTitle('Поиск');
    this.searchInput = page.getByPlaceholder('Поиск по названию...');
    this.createButton = page.getByRole("button", { name: 'Создать КП' });
    this.proposalsList = page.getByTestId('proposals-list');
    this.createProposalModal = new CreateProposalComponent(page);
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
    await this.createProposalModal.openCalculatorSelect();
    await this.createProposalModal.selectCalculator(calculatorName);

  }

  // получение варианта калькулятора через компонент формы создания
  
  getCalculatorOption(calculatorName) {
    return this.createProposalModal.getCalculatorOption(calculatorName);
  }
  // создание КП

  async createProposal(proposal) {
    await this.openCreateProposalModal();
    await this.createProposalModal.createProposal(proposal);

  }

  getProposalByName(proposalName) {
  return this.proposalRows.filter({ hasText: proposalName });
}

  async openProposalByName(proposalName) {
    await this.getProposalByName(proposalName).click();

  }

  // получение значения валюты в формате, отображаемом на странице КП
  getCurrency(currency) {
    const currencySymbols = {
      RUB: '₽',
      KZT: '₸',
      UZS: 'сум',
      EUR: '€',
    };
    const currencySymbol = currencySymbols[currency] ?? currency;

    return this.page.getByText(new RegExp(`0[,.]00\\s*${currencySymbol}`)).first();

  }

  getOpenedProposalTitle(proposalName) {
  return this.page.getByRole('heading', {
    name: proposalName,
  });
  }
}

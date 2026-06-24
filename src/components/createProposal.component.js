export class CreateProposalComponent {
  constructor (page) {
    this.page = page;

    this.modal = page.getByRole('dialog');
    this.title = this.modal.getByRole('heading', {name: 'Создать КП'});

    this.nameInput = this.modal.getByPlaceholder('Например: КП для ООО Рога и Копыта');
    this.calculatorSelect = this.modal.getByText('Выберите калькулятор');
    this.cancelButton = this.modal.getByRole('button', { name: 'Отмена' });
    this.createButton = this.modal.getByRole('button', { name: 'Создать' });
    this.closeButton = this.modal.getByRole('button').first();
  }

  async fillName(name) {
    await this.nameInput.fill(name);
  }

  async openCalculatorSelect() {
    await this.calculatorSelect.click();
  }
  
  async selectCalculator(calculatorName) {
    await this.page.getByRole('option', { name: calculatorName }).click();
  }

  async createProposal({ proposalName, calculatorName }) {
    await this.fillName(proposalName);
    await this.openCalculatorSelect();
    await this.selectCalculator(calculatorName);
    await this.clickCreateButton();
  }

  async clickCancelButton() {
    await this.cancelButton.click();
  }

  async clickCreateButton() {
    await this.createButton.click();
  }

  async clickCloseButton() {
    await this.closeButton.click();
  }

}

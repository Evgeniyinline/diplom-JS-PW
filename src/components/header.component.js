export class HeaderComponent {

  constructor(page) {
    this.page = page;

    this.proposalsLink = page.getByRole("link", { name: 'Мои КП' });
    this.nomenclaturesLink = page.getByRole("link", { name: 'Номенклатуры' });
    this.usersLink = page.getByRole("link", { name: 'Пользователи' });
    this.calcLink = page.getByRole("link", { name: 'Калькуляторы' });
  }

  async openProposals() {
    await this.proposalsLink.click();

  }

  async openNomenclatures() {
    await this.nomenclaturesLink.click();

  }

  async openUsers() {
    await this.usersLink.click();

  }

  async openCalc() {
    await this.calcLink.click();

  }

  getNameProposalsPage() {
    return this.proposalsLink;
  }

  getNameNomenclaturesPage() {
    return this.nomenclaturesLink;
  }

  getNameCalcPage() {
    return this.calcLink;
  }
  

  getNameUsersPage() {
    return this.usersLink;
  }

}
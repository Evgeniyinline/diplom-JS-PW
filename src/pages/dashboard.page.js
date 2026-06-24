import { CreateProposalComponent } from "@/components/index.js";

export class DashboardPage {
  constructor (page) {
    this.page = page;

    // Заголовок страницы
    this.title = page.getByRole('heading', {name: 'Обзор'});

    // Фильтры периода
    this.weekButton = page.getByRole('button', {name: 'Неделя'});
    this.monthButton = page.getByRole('button', {name: 'Месяц'});
    this.quarterButton = page.getByRole('button', {name: 'Квартал'});
    
    // Основные кнопки на странице
    this.createProposalButton = page.getByRole('button', {name: 'Новый расчёт'});

    this.createProposalModal = new CreateProposalComponent(page);

  }
  
  // открыть создание КП (Новый расчёт)
  async openCreateProposalModal() {
    await this.createProposalButton.click();
  }

  async createProposal(proposal) {
    await this.openCreateProposalModal();
    await this.createProposalModal.createProposal(proposal);
  }


}

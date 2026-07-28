import { expect } from "@playwright/test";
import { test } from '@/helpers/fixtures/fixture.js'

import { ProposalBuilder } from '@/helpers/builders/index.js'

// проверка поиска КП - empty state страница
test ('Поиск КП: показан empty state если результатов нет', async ({ adminApp }) => {
  await adminApp.openProposalPage();
  await adminApp.proposalPage.searchOrder(`Не существующее КП ${Date.now()}`);

  await expect(adminApp.emptyStateComponent.getSearchResult()).toBeVisible();
  
});

// проверка поиска КП - найден результат по существующему названию
test ('Поиск КП: найден результат по созданному названию', async ({ managerApp, proposalsApi }) => {
  const proposal = new ProposalBuilder().withBaseRub().build();

  await proposalsApi.createProposal(proposal);
  await managerApp.openProposalPage();
  await managerApp.proposalPage.searchOrder(proposal.proposalName);

  await expect(managerApp.proposalPage.getProposalByName(proposal.proposalName)).toBeVisible();
  await expect(managerApp.emptyStateComponent.getSearchResult()).not.toBeVisible();

});

// проверка поиска КП - очистка поиска возвращает список КП
test ('Поиск КП: очистка поиска возвращает список КП', async ({ managerApp, proposalsApi }) => {
  const proposal = new ProposalBuilder().withBaseRub().build();

  await proposalsApi.createProposal(proposal);
  await managerApp.openProposalPage();
  await managerApp.proposalPage.searchOrder(`Не существующее КП ${Date.now()}`);
  await managerApp.proposalPage.clearSearch();

  expect(await managerApp.proposalPage.getProposalsCount()).toBeGreaterThan(0);

});

// проверка создания КП - новое КП отображается в списке
test ('Создание КП: полный UI-флоу Pro · RUB', async ({ managerApp }) => {
  const proposal = new ProposalBuilder().withProRub().build();

  await managerApp.openProposalPage();
  await managerApp.proposalPage.createProposal(proposal);

  await expect(managerApp.proposalPage.getOpenedProposalTitle(proposal.proposalName)).toBeVisible();
  await expect(managerApp.proposalPage.getCurrency(proposal.expectedCurrency)).toBeVisible();

  await managerApp.openProposalPage();

  await expect(managerApp.proposalPage.getProposalByName(proposal.proposalName)).toBeVisible();

});

test ('В форме создания доступны калькуляторы всех регионов', async ({ managerApp }) => {
  await managerApp.openProposalPage();
  await managerApp.proposalPage.openCreateProposalModal();
  await managerApp.proposalPage.createProposalModal.openCalculatorSelect();

  for (const proposal of ProposalBuilder.getCalculatorProposals()) {
    await expect(managerApp.proposalPage.getCalculatorOption(proposal.calculatorName)).toBeVisible();
  }

});

// Проверяет ошибки обязательных полей при отправке пустой формы создания КП.
test('Форма создания КП валидирует обязательные поля', async ({ managerApp }) => {
  const modal = managerApp.proposalPage.createProposalModal;

  await managerApp.openProposalPage();
  await managerApp.proposalPage.openCreateProposalModal();
  await modal.clickCreateButton();

  await expect(modal.nameError).toBeVisible();
  await expect(modal.calculatorError).toBeVisible();
  await expect(modal.modal).toBeVisible();

});

// Проверяет, что отмена закрывает заполненную форму и не добавляет новое КП в список.
test('Отмена закрывает форму и не создаёт КП', async ({ managerApp }) => {
  const proposal = new ProposalBuilder().withBaseRub().build();
  const modal = managerApp.proposalPage.createProposalModal;

  await managerApp.openProposalPage();

  const proposalsCountBefore = await managerApp.proposalPage.getProposalsCount();

  await managerApp.proposalPage.openCreateProposalModal();
  await modal.fillName(proposal.proposalName);
  await modal.openCalculatorSelect();
  await modal.selectCalculator(proposal.calculatorName);
  await modal.clickCancelButton();

  await expect(modal.modal).not.toBeVisible();
  await expect(managerApp.proposalPage.getProposalByName(proposal.proposalName)).not.toBeVisible();
  expect(await managerApp.proposalPage.getProposalsCount()).toBe(proposalsCountBefore);

});

test ('Dashboard: страница /dashboard открывается', async ({ managerApp }) => {
  await managerApp.openDashboardPage();

  await expect(managerApp.page).toHaveURL(/\/dashboard$/);
  await expect(managerApp.dashboardPage.title).toBeVisible();

});

test ('Создание КП из dashboard', async ({ managerApp }) => {
  const proposal = new ProposalBuilder().withBaseRub().build();

  await managerApp.openDashboardPage();
  await managerApp.dashboardPage.createProposal(proposal);

  await expect(managerApp.proposalPage.getOpenedProposalTitle(proposal.proposalName)).toBeVisible();

});

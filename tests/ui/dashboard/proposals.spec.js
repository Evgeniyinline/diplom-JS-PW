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
test ('Поиск КП: найден результат по созданному названию', async ({ managerApp }) => {
  const proposal = new ProposalBuilder().withBaseRub().build();

  await managerApp.openProposalPage();
  await managerApp.proposalPage.createProposal(proposal);
  await managerApp.openProposalPage();
  await managerApp.proposalPage.searchOrder(proposal.proposalName);

  await expect(managerApp.proposalPage.getProposalByName(proposal.proposalName)).toBeVisible();
  await expect(managerApp.emptyStateComponent.getSearchResult()).not.toBeVisible();
});

// проверка поиска КП - очистка поиска возвращает список КП
test ('Поиск КП: очистка поиска возвращает список КП', async ({ managerApp }) => {
  const proposal = new ProposalBuilder().withBaseRub().build();

  await managerApp.openProposalPage();
  await managerApp.proposalPage.createProposal(proposal);
  await managerApp.openProposalPage();
  await managerApp.proposalPage.searchOrder(`Не существующее КП ${Date.now()}`);
  await managerApp.proposalPage.clearSearch();

  expect(await managerApp.proposalPage.getProposalsCount()).toBeGreaterThan(0);
});

// проверка создания КП - новое КП отображается в списке
test ('Создание КП: новое КП отображается в списке', async ({ managerApp }) => {
  const proposal = new ProposalBuilder().withBaseRub().build();

  await managerApp.openProposalPage();
  await managerApp.proposalPage.createProposal(proposal);

  await expect(managerApp.proposalPage.getOpenedProposalTitle(proposal.proposalName)).toBeVisible();

  await managerApp.openProposalPage();

  await expect(managerApp.proposalPage.getProposalByName(proposal.proposalName)).toBeVisible();

});

// проверка создания КП для каждого региона калькулятора
for (const proposal of ProposalBuilder.getCalculatorProposals()) {
  test(`Создание КП: ${proposal.calculatorName}`, async ({ managerApp }) => {
    await managerApp.openProposalPage();
    await managerApp.proposalPage.createProposal(proposal);

    await expect(managerApp.proposalPage.getOpenedProposalTitle(proposal.proposalName)).toBeVisible();

  });

}

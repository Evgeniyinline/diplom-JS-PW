import { expect } from "@playwright/test";
import { test } from '@/helpers/fixtures/fixture.js'

import { ProposalBuilder } from '@/helpers/builders/proposal.builder.js'

test.describe.configure({ mode: 'serial' });

// проверка поиска КП - empty state страница
test ('Поиск КП: показан empty state если результатов нет', async ({ adminApp }) => {
  await adminApp.openProposalPage();
  // + faker
  await adminApp.proposalPage.searchOrder('КП 123');

  await expect(adminApp.emptyStateComponent.getSearchResult()).toBeVisible();
});

// проверка поиска КП - найден результат по существующему названию
test ('Поиск КП: найден результат по существующему названию', async ({ adminApp }) => {
  await adminApp.openProposalPage();
  // + faker
  await adminApp.proposalPage.searchOrder('Автотест КП');

  await expect(adminApp.emptyStateComponent.getSearchResult()).not.toBeVisible();
});

// проверка поиска КП - очистка поиска возвращает список КП
test ('Поиск КП: очистка поиска возвращает список КП', async ({ adminApp }) => {
  await adminApp.openProposalPage();
  // + faker
  await adminApp.proposalPage.searchOrder('КП 123');
  await adminApp.proposalPage.clearSearch();

  expect(await adminApp.proposalPage.getProposalsCount()).toBeGreaterThan(0);
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

// проверка создания КП - новое КП отображается в списке для каждого региона калькулятора
for (const proposal of ProposalBuilder.getCalculatorProposals()) {
  test(`Создание КП: ${proposal.calculatorName}`, async ({ managerApp }) => {
    await managerApp.openProposalPage();
    await managerApp.proposalPage.createProposal(proposal);

    await expect(managerApp.proposalPage.getOpenedProposalTitle(proposal.proposalName)).toBeVisible();
    await managerApp.openProposalPage();

    await expect(managerApp.proposalPage.getProposalByName(proposal.proposalName)).toBeVisible();

  });

}

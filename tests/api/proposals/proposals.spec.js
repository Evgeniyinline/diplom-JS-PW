import { expect } from '@playwright/test';
import { test } from '@/helpers/fixtures/fixture.js';
import { ProposalBuilder } from '@/helpers/builders/index.js';

for (const proposal of ProposalBuilder.getCalculatorProposals()) {

  test(`@POST Создать КП: ${proposal.calculatorName}`, async ({ proposalsApi }) => {
    
    const calculatorSet = await proposalsApi.getCalculatorSetByName(proposal.calculatorName);
    const response = await proposalsApi.createProposal(proposal);

    expect(response.status()).toBe(201);

    const body = await response.json();

    expect(body.data.name).toBe(proposal.proposalName);
    expect(body.data.calculatorSetId).toBe(calculatorSet.id);

  });
}

// Проверяет валидацию API на создание КП без обязательного названия
test('@POST Пустое название КП не проходит валидацию', async ({ proposalsApi }) => {
  
  const proposal = new ProposalBuilder()
    .withBaseRub()
    .withProposalName('')
    .build();

  const response = await proposalsApi.createProposal(proposal);

  expect(response.status()).toBe(400);
  expect(await response.json()).toBeTruthy();

});

export class ProposalBuilder {
  constructor() {
    this.proposal = {
      proposalName: `Автотест КП ${Date.now()}`,
      calculatorName: 'Base · RUB',
      expectedCurrency: 'RUB',
    };
  }

  withBaseRub() {
    this.proposal.calculatorName = 'Base · RUB';
    this.proposal.expectedCurrency = 'RUB';
    return this;
  }

  withProRub() {
    this.proposal.calculatorName = 'Pro · RUB';
    this.proposal.expectedCurrency = 'RUB';
    return this;
  }

  withKzKzt() {
    this.proposal.calculatorName = 'KZ · KZT';
    this.proposal.expectedCurrency = 'KZT';
    return this;
  }

  withProposalName(proposalName) {
    this.proposal.proposalName = proposalName;
    return this;
  }

  static getCalculatorProposals() {
    const createdAt = Date.now();

    return [
      new ProposalBuilder().withBaseRub().withProposalName(`Автотест КП Base RUB ${createdAt}`).build(),
      new ProposalBuilder().withProRub().withProposalName(`Автотест КП Pro RUB ${createdAt}`).build(),
      new ProposalBuilder().withKzKzt().withProposalName(`Автотест КП KZ KZT ${createdAt}`).build(),
    ];
  }

  build() {
    return this.proposal;
  }
}

export class ProposalBuilder {
  withBaseRub() {
    this.calculatorName = 'Base · RUB';
    this.expectedCurrency = 'RUB';
    return this;
  }

  withProRub() {
    this.calculatorName = 'Pro · RUB';
    this.expectedCurrency = 'RUB';
    return this;
  }

  withKzKzt() {
    this.calculatorName = 'KZ · KZT';
    this.expectedCurrency = 'KZT';
    return this;
  }

  withProposalName(proposalName) {
    this.proposalName = proposalName;
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
    return {
      proposalName: this.proposalName ?? `Автотест КП ${Date.now()}`,
      calculatorName: this.calculatorName ?? 'Base · RUB',
      expectedCurrency: this.expectedCurrency ?? 'RUB',
    };
  }
}

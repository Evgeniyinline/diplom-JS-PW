import { ProposalsController } from '@/controllers/proposals.controller.js';

export class ProposalsService {
  constructor(request) {
    this.proposalsController = new ProposalsController(request);
    this.calculatorSets = null;
  }

  // получение калькулятора по отображаемому в UI названию с кешированием списка
  async getCalculatorSetByName(calculatorName) {
    if (!this.calculatorSets) {
      const response = await this.proposalsController.getCalculatorSets();

      if (!response.ok()) {
        throw new Error(`Не удалось получить калькуляторы. Status: ${response.status()}`);
      }

      const body = await response.json();
      this.calculatorSets = body.data;
    }

    const calculatorSet = this.calculatorSets.find(
      ({ name, currency }) => `${name} · ${currency}` === calculatorName
    );

    if (!calculatorSet) {
      throw new Error(`Калькулятор ${calculatorName} не найден`);
    }

    return calculatorSet;
  }

  // преобразование данных builder в payload создания КП
  async createProposal({ proposalName, calculatorName }) {
    const calculatorSet = await this.getCalculatorSetByName(calculatorName);

    return this.proposalsController.createProposal({
      name: proposalName,
      calculatorSetId: calculatorSet.id,
    });
  }
}

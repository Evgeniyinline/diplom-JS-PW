import { ProposalsService } from '@/services/proposals.service.js';

export class ProposalsFacade {
  constructor(request) {
    this.proposalsService = new ProposalsService(request);
  }

  // получение калькулятора по названию для подготовки и проверок теста
  async getCalculatorSetByName(calculatorName) {
    return this.proposalsService.getCalculatorSetByName(calculatorName);
  }

  // создание КП через единый API-фасад
  async createProposal(proposal) {
    return this.proposalsService.createProposal(proposal);
  }
}

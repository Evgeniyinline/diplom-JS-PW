// Контроллер знает адреса API КП и возвращает сырой response.
// Поиск calculatorSetId по понятному имени выполняется в сервисе.
export class ProposalsController {
  constructor(request) {
    this.request = request;
  }

  // получение доступных пользователю калькуляторов
  async getCalculatorSets() {
    return this.request.get('/api/calculator-sets');
  }

  // создание КП с переданным названием и calculatorSetId
  async createProposal(proposal) {
    return this.request.post('/api/proposals', {
      data: proposal,
    });
    
  }
}

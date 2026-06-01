export class EmptyStateComponent {
  constructor (page) {
    this.page = page;

    this.searchResult = page.getByText('По вашему запросу ничего не найдено');
  }

  getSearchResult () {
    return this.searchResult;
  }
}
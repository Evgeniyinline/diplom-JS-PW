export class UsersPage {
  constructor (page) {
    this.page = page;
  }

  async openUsers() {
    await this.page.goto("/users");
  }
  async getUsersCount () {
    return this.page.locator('tr').count();
  }
  
}
import { AuthPage, ProposalPage, UsersPage } from "@/pages/index.js";
import { HeaderComponent, EmptyStateComponent } from "@/components/index.js";

export class App {
  constructor(page) {
    this.page = page;

    this.headerComponent = new HeaderComponent(page);
    this.emptyStateComponent = new EmptyStateComponent(page);
    this.authPage = new AuthPage(page);
    this.proposalPage = new ProposalPage(page);
    this.usersPage = new UsersPage(page);
  }

  async openProposalPage () {
    await this.page.goto('/proposals');
  }
}

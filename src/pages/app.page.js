import { AuthPage, ProposalPage, UsersPage, DashboardPage, NomenclaturesPage, ProfilePage } from "@/pages/index.js";
import { HeaderComponent, EmptyStateComponent } from "@/components/index.js";

export class App {
  constructor(page) {
    this.page = page;

    this.headerComponent = new HeaderComponent(page);
    this.emptyStateComponent = new EmptyStateComponent(page);
    this.authPage = new AuthPage(page);
    this.proposalPage = new ProposalPage(page);
    this.usersPage = new UsersPage(page);
    this.dashboardPage = new DashboardPage(page);
    this.nomenclaturesPage = new NomenclaturesPage(page);
    this.profilePage = new ProfilePage(page);
  }

  async openProposalPage () {
    await this.page.goto('/proposals');
  }

  async openDashboardPage () {
    await this.page.goto('/dashboard');
  }

  async openNomenclaturesPage () {
    await this.page.goto('/nomenclatures');
  }

  async openProfilePage () {
    await this.page.goto('/profile');
  }
}

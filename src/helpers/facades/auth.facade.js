import { SignInEmailBuilder } from "@/helpers/builders/index.js";
import { AuthService } from "@/services/auth.service.js";
import { UsersService } from "@/services/users.service.js";
import { AccessGroupsService } from "@/services/access-groups.service.js";

export class AuthFacade {
  constructor(request) {
    this.authService = new AuthService(request);
    this.usersService = new UsersService(request);
    this.accessGroupsService = new AccessGroupsService(request);
  }

  async authorizeByApi(context, payload = new SignInEmailBuilder().build()) {
    await this.authService.authorizeUiContext(context, payload);
  }

  async authorizeAdminByApi(payload = new SignInEmailBuilder().build()) {
    return this.authService.authorizeAdmin(payload);
  }

  async getSession() {
    return this.authService.getSession();
  }

  async createUser(user) {
    return this.usersService.createUser(user);
  }

  async getUser(userId) {
    return this.usersService.getUser(userId);
  }

  async updateUser(userId, user) {
    return this.usersService.updateUser(userId, user);
  }

  async removeUser(userId) {
    return this.usersService.removeUser(userId);
  }

  async addUserToAccessGroupByName(userId, accessGroupName) {
    return this.accessGroupsService.addUserToAccessGroupByName(userId, accessGroupName);
  }
}

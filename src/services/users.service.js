import { UsersController } from "@/controllers/users.controller.js";
import { UserBuilder } from "@/helpers/builders/user.builder.js";
import { AccessGroupsService } from "@/services/access-groups.service.js";

const MANAGER_ACCESS_GROUP_NAMES = ['Pro/base', 'KZ/UZ'];

export class UsersService {
  constructor(request) {
    this.usersController = new UsersController(request);
    this.accessGroupsService = new AccessGroupsService(request);
  }

  async createUser(user = new UserBuilder().withEmail().withPassword().withUserName().withUserSurname().withRole().build(), accessGroupName) {
    const response = await this.usersController.createUser(user);

    if (response.ok()) {
      const body = await response.json();
      const accessGroupNames = user.role === 'manager'
        ? MANAGER_ACCESS_GROUP_NAMES
        : [accessGroupName];

      for (const groupName of accessGroupNames) {
        await this.accessGroupsService.addUserToAccessGroupByName(body.user.id, groupName);
      }
    }

    return response;
  }

  async getUser(userId) {
    return this.usersController.getUser(userId);
  }

  async updateUser(userId, user) {
    return this.usersController.updateUser(userId, user);
  }

  async removeUser(userId) {
    return this.usersController.removeUser(userId);
  }
}

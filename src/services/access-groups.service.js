import { expect } from "@playwright/test";
import { AccessGroupsController } from "@/controllers/access-groups.controller.js";

const DEFAULT_ACCESS_GROUP_NAME = 'Pro/base';
const ACCESS_GROUP_RETRY_COUNT = 3;

function wait(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

export class AccessGroupsService {
  constructor(request) {
    this.accessGroupsController = new AccessGroupsController(request);
  }

  async getAccessGroups() {
    return this.accessGroupsController.getAccessGroups();
  }

  async getAccessGroupByName(accessGroupName = DEFAULT_ACCESS_GROUP_NAME) {
    const response = await this.getAccessGroups();

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    const accessGroup = body.data.find((group) => group.name === accessGroupName);

    expect(accessGroup).toBeTruthy();

    return accessGroup;
  }

  async addUserToAccessGroupByName(userId, accessGroupName = DEFAULT_ACCESS_GROUP_NAME) {
    const accessGroup = await this.getAccessGroupByName(accessGroupName);
    let response;

    for (let attempt = 1; attempt <= ACCESS_GROUP_RETRY_COUNT; attempt += 1) {
      response = await this.accessGroupsController.toggleUser(accessGroup.id, userId);

      if (response.ok()) {
        return response;
      }

      if (attempt < ACCESS_GROUP_RETRY_COUNT) {
        await wait(500);
      }
    }

    const errorBody = await response.text();

    expect(
      response.ok(),
      `Не удалось добавить пользователя ${userId} в группу ${accessGroupName}. Status: ${response.status()}. Body: ${errorBody}`
    ).toBeTruthy();

    return response;
  }
}

export { DEFAULT_ACCESS_GROUP_NAME };

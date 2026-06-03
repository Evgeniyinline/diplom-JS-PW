import { AccessGroupsController } from "@/controllers/access-groups.controller.js";

const DEFAULT_ACCESS_GROUP_NAME = 'Pro/base';
const ACCESS_GROUP_RETRY_COUNT = 3;
const ACCESS_GROUP_RETRY_TIMEOUT = 1000;

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
    let response;

    for (let attempt = 1; attempt <= ACCESS_GROUP_RETRY_COUNT; attempt += 1) {
      response = await this.getAccessGroups();

      if (response.ok()) {
        break;
      }

      if (response.status() !== 429 || attempt === ACCESS_GROUP_RETRY_COUNT) {
        break;
      }

      await wait(ACCESS_GROUP_RETRY_TIMEOUT * attempt);
    }

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Не удалось получить группы доступа. Status: ${response.status()}. Body: ${body}`);
    }

    const body = await response.json();
    const accessGroup = body.data.find((group) => group.name === accessGroupName);

    if (!accessGroup) {
      throw new Error(`Группа доступа ${accessGroupName} не найдена`);
    }

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
        await wait(ACCESS_GROUP_RETRY_TIMEOUT * attempt);
      }
    }

    const errorBody = await response.text();

    throw new Error(
      `Не удалось добавить пользователя ${userId} в группу ${accessGroupName}. Status: ${response.status()}. Body: ${errorBody}`
    );
  }
}

export { DEFAULT_ACCESS_GROUP_NAME };

import { BASE_URL } from "@/controllers/auth.controller.js";

export class AccessGroupsController {
  constructor(request) {
    this.request = request;
  }

  async getAccessGroups() {
    return this.request.get(`${BASE_URL}/api/access-groups`, {
      headers: {
        Origin: BASE_URL,
      },
    });
  }

  async toggleUser(accessGroupId, userId) {
    return this.request.patch(`${BASE_URL}/api/access-groups/${accessGroupId}/user`, {
      data: {
        userId,
      },
      headers: {
        Origin: BASE_URL,
      },
    });
  }
}

export class AccessGroupsController {
  constructor(request) {
    this.request = request;
  }

  async getAccessGroups() {
    return this.request.get('/api/access-groups');
  }

  async toggleUser(accessGroupId, userId) {
    return this.request.patch(`/api/access-groups/${accessGroupId}/user`, {
      data: {
        userId,
      },
    });
  }
}

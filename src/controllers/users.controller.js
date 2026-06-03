export class UsersController {
  constructor(request) {
    this.request = request;
  }

  async createUser(user) {
    return this.request.post('/api/auth/admin/create-user', {
      data: user,
    });
  }

  async getUser(userId) {
    return this.request.get(`/api/users/${userId}`);
  }

  async updateUser(userId, user) {
    return this.request.put(`/api/users/${userId}`, {
      data: user,
    });
  }

  async removeUser(userId) {
    return this.request.post('/api/auth/admin/remove-user', {
      data: {
        userId,
      },
    });
  }
}

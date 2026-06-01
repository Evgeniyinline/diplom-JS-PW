import { BASE_URL } from "@/controllers/auth.controller.js";

export class UsersController {
  constructor(request) {
    this.request = request;
  }

  async createUser(user) {
    return this.request.post(`${BASE_URL}/api/auth/admin/create-user`, {
      data: user,
      headers: {
        Origin: BASE_URL,
      },
    });
  }

  async getUser(userId) {
    return this.request.get(`${BASE_URL}/api/users/${userId}`, {
      headers: {
        Origin: BASE_URL,
      },
    });
  }

  async updateUser(userId, user) {
    return this.request.put(`${BASE_URL}/api/users/${userId}`, {
      data: user,
      headers: {
        Origin: BASE_URL,
      },
    });
  }

  async removeUser(userId) {
    return this.request.post(`${BASE_URL}/api/auth/admin/remove-user`, {
      data: {
        userId,
      },
      headers: {
        Origin: BASE_URL,
      },
    });
  }
}

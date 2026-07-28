import { ProfileService } from '@/services/profile.service.js';
import { UsersService } from '@/services/users.service.js';

export class ProfileFacade {
  constructor(request) {
    this.profileService = new ProfileService(request);
    this.usersService = new UsersService(request);
  }

  // получение данных профиля текущего пользователя
  async getProfile() {
    return this.usersService.getCurrentUserProfile();
  }

  // обновление данных профиля текущего пользователя
  async updateProfile(profile) {
    return this.usersService.updateCurrentUserProfile(profile);
  }

  // получение аватара профиля
  async getAvatar() {
    return this.profileService.getAvatar();
  }

  // загрузка аватара профиля
  async uploadAvatar(file) {
    return this.profileService.uploadAvatar(file);
  }

  // удаление аватара профиля
  async deleteAvatar() {
    return this.profileService.deleteAvatar();
  }

  // получение подписи профиля
  async getSignature() {
    return this.profileService.getSignature();
  }

  // загрузка подписи профиля
  async uploadSignature(file) {
    return this.profileService.uploadSignature(file);
  }

  // удаление подписи профиля
  async deleteSignature() {
    return this.profileService.deleteSignature();
  }
}

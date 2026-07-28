import { UploadsController } from '@/controllers/uploads.controller.js';

export class ProfileService {
  constructor(request) {
    this.uploadsController = new UploadsController(request);
  }

  // получение аватара через uploads-контроллер
  async getAvatar() {
    return this.uploadsController.getAvatar();
  }

  // передача файла аватара в uploads-контроллер
  async uploadAvatar(file) {
    return this.uploadsController.uploadAvatar(file);
  }

  // удаление аватара через uploads-контроллер
  async deleteAvatar() {
    return this.uploadsController.deleteAvatar();
  }

  // получение подписи через uploads-контроллер
  async getSignature() {
    return this.uploadsController.getSignature();
  }

  // передача файла подписи в uploads-контроллер
  async uploadSignature(file) {
    return this.uploadsController.uploadSignature(file);
  }

  // удаление подписи через uploads-контроллер
  async deleteSignature() {
    return this.uploadsController.deleteSignature();
  }
}

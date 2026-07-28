// Контроллер знает адреса API и параметры запросов загрузки файлов.
// Проверок и подготовки тестовых данных здесь нет — он возвращает сырой response.
export class UploadsController {
  constructor(request) {
    this.request = request;
  }

  // получение ссылки на аватар текущего пользователя
  async getAvatar() {
    return this.request.get('/api/uploads/avatar');
  }

  // загрузка аватара через multipart-запрос
  async uploadAvatar(file) {
    return this.request.post('/api/uploads/avatar', {
      multipart: { file },
    });
  }

  // удаление аватара текущего пользователя
  async deleteAvatar() {
    return this.request.delete('/api/uploads/avatar');
  }

  // получение ссылки на подпись текущего пользователя
  async getSignature() {
    return this.request.get('/api/uploads/signature');
  }

  // загрузка подписи через multipart-запрос
  async uploadSignature(file) {
    return this.request.post('/api/uploads/signature', {
      multipart: { file },
    });
  }

  // удаление подписи текущего пользователя
  async deleteSignature() {
    return this.request.delete('/api/uploads/signature');
  }
}

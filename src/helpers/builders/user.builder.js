import { faker, fakerRU } from "@faker-js/faker";

// генерация пользователя
export class UserBuilder {

  withEmail (email) {
    this.email = email ?? faker.internet.email();
    return this;

  }

  withPassword (password) {
    this.password = password ?? faker.internet.password();
    return this;

  }

  withValidPassword (password) {
    this.password = password ?? `Test${faker.number.int({ min: 100, max: 999 })}${faker.string.alpha({ length: 4 })}!`;
    return this;

  }

  withUserName (userName) {
    this.name = userName ?? faker.person.firstName();
    return this;

  }

  withUserSurname (userSurname) {
    this.surname = userSurname ?? faker.person.lastName();
    return this;

  }

  withRole (role) {
    this.role = role ?? 'manager';
    return this;

  }

  // добавление должности в данные профиля менеджера
  withPosition (position) {
    this.position = position ?? faker.person.jobTitle();
    return this;

  }

  // добавление готового списка контактов
  withContacts (contacts) {
    this.contacts = contacts ?? [];
    return this;

  }

  // добавление телефона в контакты профиля
  withPhone (phone) {
    this.contacts = this.contacts ?? [];
    this.contacts.push({
      type: 'phone',
      value: phone ?? fakerRU.phone.number(),
    });
    return this;

  }

  // добавление email в контакты профиля
  withContactEmail (email) {
    this.contacts = this.contacts ?? [];
    this.contacts.push({
      type: 'email',
      value: email ?? faker.internet.email(),
    });
    return this;

  }

  // настройка отображения менеджера в PDF
  withShowInPdf (showInPdf = true) {
    this.showInPdf = showInPdf;
    return this;

  }

  // сбор полного пользователя со стандартными валидными данными
  build () {
    return {
      email: this.email ?? faker.internet.email(),
      password: this.password ?? `Test${faker.number.int({ min: 100, max: 999 })}${faker.string.alpha({ length: 4 })}!`,
      name: this.name ?? faker.person.firstName(),
      surname: this.surname ?? faker.person.lastName(),
      role: this.role ?? 'manager',
    };

  }

  // сбор имени и фамилии для частичного обновления пользователя
  buildPersonalData () {
    return {
      name: this.name ?? faker.person.firstName(),
      surname: this.surname ?? faker.person.lastName(),
    };

  }

  // сбор данных для эндпоинта /users/me
  buildProfile () {
    return {
      position: this.position ?? null,
      contacts: this.contacts ?? [],
      showInPdf: this.showInPdf ?? false,
    };

  }
}

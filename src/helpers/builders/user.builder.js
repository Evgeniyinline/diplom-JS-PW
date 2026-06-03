import { faker } from "@faker-js/faker";

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

  // сбор пользователя
  build () {
    const result = {...this};
    return result;

  }
}

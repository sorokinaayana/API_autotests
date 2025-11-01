import { faker } from '@faker-js/faker';

export class UserBuilder {
  constructor() {
    this.name = faker.person.fullName();
    this.email = faker.internet.email();
    this.password = faker.internet.password();
  }

  withName(name) {
    this.name = name;
    return this;
  }

  withEmail(email) {
    this.email = email;
    return this;
  }

  build() {
    return {
      name: this.name,
      email: this.email,
      password: this.password
    };
  }
}
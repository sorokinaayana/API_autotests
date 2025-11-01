import { faker } from '@faker-js/faker';

export class TodoBuilder {
  constructor() {
    this.title = faker.lorem.words(3);
    this.doneStatus = false;
    this.description = faker.lorem.sentence();
  }

  withTitle(title) {
    this.title = title;
    return this;
  }

  withDoneStatus(status) {
    this.doneStatus = status;
    return this;
  }

  withDescription(desc) {
    this.description = desc;
    return this;
  }

  build() {
    return {
      title: this.title,
      doneStatus: this.doneStatus,
      description: this.description
    };
  }
}
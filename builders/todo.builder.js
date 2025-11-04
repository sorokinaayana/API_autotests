export class TodoBuilder {
  constructor() {
    this.reset();
  }

  reset() {
    this.data = {
      title: "",
      doneStatus: false,
      description: ""
    };
    return this;
  }

  withTitle(title = "Тестовая задача") {
    this.data.title = title;
    return this;
  }

  withDescription(description = "Тестовое описание") {
    this.data.description = description;
    return this;
  }

  withDoneStatus(doneStatus = false) {
    this.data.doneStatus = doneStatus;
    return this;
  }

  build() {
    const result = { ...this.data };
    this.reset();
    return result;
  }
}

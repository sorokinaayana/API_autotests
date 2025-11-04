// API_autotests/index.js
export class ApiClient {
  constructor(request, token) {
    this.request = request;
    this.baseURL = 'https://apichallenges.herokuapp.com';
    this.token = token;
  }

  // GET методы
  async getAllTodos() {
    return await this.request.get(`${this.baseURL}/todos`, {
      headers: {
        'X-Challenger': this.token,
      }
    });
  }

  async getTodoById(id) {
    return await this.request.get(`${this.baseURL}/todos/${id}`, {
      headers: {
        'X-Challenger': this.token,
      }
    });
  }

  async getTodosWithFilter(doneStatus) {
    return await this.request.get(`${this.baseURL}/todos?doneStatus=${doneStatus}`, {
      headers: {
        'X-Challenger': this.token,
      }
    });
  }

  // POST методы  
  async createTodo(todoData) {
    return await this.request.post(`${this.baseURL}/todos`, {
      headers: {
        'X-Challenger': this.token,
        'Content-Type': 'application/json'
      },
      data: todoData
    });
  }

  // PUT методы
  async updateTodo(id, todoData) {
    return await this.request.put(`${this.baseURL}/todos/${id}`, {
      headers: {
        'X-Challenger': this.token,
        'Content-Type': 'application/json'
      },
      data: todoData
    });
  }

  // DELETE методы
  async deleteTodo(id) {
    return await this.request.delete(`${this.baseURL}/todos/${id}`, {
      headers: {
        'X-Challenger': this.token,
      }
    });
  }
}

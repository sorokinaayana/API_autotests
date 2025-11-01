import { expect } from '@playwright/test';

export class ApiClient {
  constructor(request) {
    this.request = request;
  }

  // GET методы
  async getAllTodos() {
    return await this.request.get('/todos');
  }

  async getTodoById(id) {
    return await this.request.get(`/todos/${id}`);
  }

  async getTodosWithFilter(doneStatus) {
    return await this.request.get(`/todos?doneStatus=${doneStatus}`);
  }

  // POST методы  
  async createTodo(todoData) {
    return await this.request.post('/todos', {
      data: todoData
    });
  }

  async createUser(userData) {
    return await this.request.post('/users', {
      data: userData
    });
  }

  // PUT методы
  async updateTodo(id, todoData) {
    return await this.request.put(`/todos/${id}`, {
      data: todoData
    });
  }

  // DELETE методы
  async deleteTodo(id) {
    return await this.request.delete(`/todos/${id}`);
  }

  // Общие проверки
  async validateResponse(response, expectedStatus = 200) {
    expect(response.status()).toBe(expectedStatus);
    return await response.json();
  }
}
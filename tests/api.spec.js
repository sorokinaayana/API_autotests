import { test, expect } from '@playwright/test';
import { ApiClient } from '../index.js';
import { TodoBuilder } from '../builders/todo.builder.js';
import { UserBuilder } from '../builders/user.builder.js';

let apiClient;

test.beforeEach(async ({ request }) => {
  apiClient = new ApiClient(request);
});

// GET запросы 

test.describe('GET запросы', () => {
  
  test('GET 1.0 - получение всех данных @GET', async () => {

    const response = await apiClient.getAllTodos();
    
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    
   
    expect(Array.isArray(data.todos)).toBe(true);
    expect(data.todos.length).toBeGreaterThan(0);
    
    // Структура данных
    const firstTodo = data.todos[0];
    expect(firstTodo).toHaveProperty('id');
    expect(firstTodo).toHaveProperty('title');
    expect(firstTodo).toHaveProperty('doneStatus');
    expect(typeof firstTodo.doneStatus).toBe('boolean');
  });

  test('GET 2.0 Получение по id @GET', async () => {

    const testTodo = new TodoBuilder().withTitle('Поиск по ID тест').build();
    const createResponse = await apiClient.createTodo(testTodo);
    const createdTodo = await createResponse.json();

    const response = await apiClient.getTodoById(createdTodo.id);
  
    expect(response.status()).toBe(200);
    
    const foundTodo = await response.json();
    
    expect(foundTodo.id).toBe(createdTodo.id);
    expect(foundTodo.title).toBe('Поиск по ID тест');
  });

  test('GET 3.0 - получение несуществующей записи @GET', async () => {

    const response = await apiClient.getTodoById(999999);
    
    expect(response.status()).toBe(404);
  });

  test('GET 4.0 фитрация по статусу @GET', async () => {
 
    const response = await apiClient.getTodosWithFilter('true');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    

    if (data.todos.length > 0) {
      data.todos.forEach(todo => {
        expect(todo.doneStatus).toBe(true);
      });
    }
  });

  test('GET0 5.0 - доп. фильтрация  @GET', async () => {

    const response = await apiClient.getTodosWithFilter('false');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    if (data.todos.length > 0) {
      data.todos.forEach(todo => {
        expect(todo.doneStatus).toBe(false);
      });
    }
  });

  test('GET 6.0 - проверка метаданных ответа @GET', async () => {

    const response = await apiClient.getAllTodos();
    
    expect(response.status()).toBe(200);
    
  
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('GE 7.0 - обработка пустого списка @GET', async () => {
   
    const response = await apiClient.getAllTodos();
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
  
    expect(Array.isArray(data.todos)).toBe(true);
  });

  test('GET 8.0 - проверка пагинации @GET', async () => {

    const response = await apiClient.request.get('/todos?page=1&limit=5');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();

    expect(data.todos.length).toBeGreaterThan(0);
  });
});

//  POST запросы

test.describe('POST запросы', () => {
  
  test('POST 1. создание со всеми параметрами @POST ', async () => {
 
    const testTodo = new TodoBuilder()
      .withTitle('Тестовая запись для дз')
      .withDescription('Подробное описание записи для дз')
      .withDoneStatus(true)
      .build();

    const response = await apiClient.createTodo(testTodo);
    
   
    expect(response.status()).toBe(201);
    
    const createdTodo = await response.json();
    
  
    expect(createdTodo.title).toBe('Тестовая запись для дз');
    expect(createdTodo.description).toBe('Подробное описание записи для дз');
    expect(createdTodo.doneStatus).toBe(true);
    expect(createdTodo.id).toBeDefined(); 
  });

  test('POST 2.0 - создание с минимальными набором параметров @POST', async () => {

    const minimalTodo = { title: 'Тест мин. набор' };

    const response = await apiClient.createTodo(minimalTodo);
    
    expect(response.status()).toBe(201);
    
    const createdTodo = await response.json();
    expect(createdTodo.title).toBe('Тест мин. набор');
   
    expect(createdTodo.doneStatus).toBe(false);
  });

  test('POST 5.0 - валидация пустого заголовка @POST', async () => {

    const invalidTodo = { title: '' };

    const response = await apiClient.createTodo(invalidTodo);
    
    expect(response.status()).toBe(400);
  });

  test('POST0 4.0  валидация отсутствия заголовка @POST', async () => {

    const invalidTodo = { description: 'Проверка , что будет , если ввести только описание' };

    const response = await apiClient.createTodo(invalidTodo);
    
    expect(response.status()).toBe(400);
  });

  test('POST 5.0   создание с  спецсимволами @POST', async () => {
   
    const specialTodo = {
      title: 'Название с спецсимволами:测试 0!@#$%',
      description: 'Описание   ><:='
    };

    const response = await apiClient.createTodo(specialTodo);
    
    expect(response.status()).toBe(201);
    
    const createdTodo = await response.json();
  
    expect(createdTodo.title).toBe('Название с спецсимволами:测试 0!@#$%');
  });

  test('POST 6.0  граничные значения @POST', async () => {
 
    const longTitle = 'A'.repeat(100); 
    const longTodo = { title: longTitle };

    const response = await apiClient.createTodo(longTodo);
    
  
    if (response.status() === 201) {
      const createdTodo = await response.json();
      expect(createdTodo.title).toBe(longTitle);
    } else {
      expect(response.status()).toBe(400);
    }
  });

  test('POST 7.0  множественное создание @POST', async () => {

    const todo1 = new TodoBuilder().withTitle('Первая запись').build();
    const todo2 = new TodoBuilder().withTitle('Вторая запись').build();

    const response1 = await apiClient.createTodo(todo1);
    const response2 = await apiClient.createTodo(todo2);
    
    expect(response1.status()).toBe(201);
    expect(response2.status()).toBe(201);
    
    const created1 = await response1.json();
    const created2 = await response2.json();
    
   
    expect(created1.id).not.toBe(created2.id);
  });

  test('POST 8.0 проверка созданных данных @POST', async () => {
 
    const testTodo = new TodoBuilder().withTitle('Проверяет данные').build();

  
    const createResponse = await apiClient.createTodo(testTodo);
    expect(createResponse.status()).toBe(201);
    const createdTodo = await createResponse.json();

    
    const getResponse = await apiClient.getTodoById(createdTodo.id);
    expect(getResponse.status()).toBe(200);
    const retrievedTodo = await getResponse.json();

    
    expect(retrievedTodo.title).toBe(createdTodo.title);
    expect(retrievedTodo.doneStatus).toBe(createdTodo.doneStatus);
  });

  test('POST 9.0  создание с альтернативными параметрами @POST', async () => {
  
    const todoWithVariousTypes = {
      title: 'Проверка 9.0',
      doneStatus: false, 
      priority: 1, 
    };
    
    const response = await apiClient.createTodo(todoWithVariousTypes);
    
    expect([201, 400]).toContain(response.status());
  });

  test('POST 10.0 - создание с вложенными элементами @POST', async () => {
   
    const todoWithNestedData = {
      title: 'Тест 10',
      metadata: {
        createdBy: 'test-user',
        category: 'work'
      }
    };
    
    const response = await apiClient.createTodo(todoWithNestedData);
   
    expect([201, 400]).toContain(response.status());
  });

  test('POST 11.0 проверка на дубль @POST', async () => {
// ЧТО ПРОВЕРЯЕМ: Поведение при создании дублирующих записей
    // ПОЧЕМУ ВАЖНО: Проверяем уникальность данных
    const duplicateTodo = { title: 'Дубль' };
    
    
    const response1 = await apiClient.createTodo(duplicateTodo);
    expect(response1.status()).toBe(201);
    
    // Попытка создать дубликат
    const response2 = await apiClient.createTodo(duplicateTodo);

    expect([201, 409, 400]).toContain(response2.status());
  });

  test('POST 12.0 - проверка дат @POST', async () => {

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    
    const todoWithDate = {
      title: 'Тест 12 - дата',
      dueDate: futureDate.toISOString()
    };
    
    const response = await apiClient.createTodo(todoWithDate);
    expect([201, 400]).toContain(response.status());
  });
});

//  PUT запросы

test.describe('PUT запросы', () => {
  let existingTodoId;

  test.beforeEach(async () => {
    
    const testTodo = new TodoBuilder().withTitle('Начальная запись').build();
    const createResponse = await apiClient.createTodo(testTodo);
    const createdTodo = await createResponse.json();
    existingTodoId = createdTodo.id;
  });

  test('PUT 1.0 - полное обновление @PUT ', async () => {

    const updatedData = new TodoBuilder()
      .withTitle('Обновленная запись')
      .withDescription('Что-то новенькое тут')
      .withDoneStatus(true)
      .build();

    const response = await apiClient.updateTodo(existingTodoId, updatedData);
    
    expect(response.status()).toBe(200);
    
    const updatedTodo = await response.json();
    expect(updatedTodo.title).toBe('Обновленная запись');
    expect(updatedTodo.description).toBe('Что-то новенькое тут');
    expect(updatedTodo.doneStatus).toBe(true);
  });

  test('PUT 2.0 -  перезапись @PUT', async () => {
   
    const updateData = { title: 'Только название поменяем' };

    const response = await apiClient.updateTodo(existingTodoId, updateData);
    
    expect(response.status()).toBe(200);
    
    const updatedTodo = await response.json();
    
    expect(updatedTodo.title).toBe('Только заголовок');
  });

  test('PUT 3.0 -  обновление несуществубщей записи @PUT', async () => {
 
    const updateData = new TodoBuilder().build();

    const response = await apiClient.updateTodo(999999, updateData);
    
    expect(response.status()).toBe(404);
  });

  test('PUT 4.0 -  валидация при обновлении @PUT', async () => {

    const invalidData = { title: '' }; 
    const response = await apiClient.updateTodo(existingTodoId, invalidData);
    
    expect(response.status()).toBe(400);
  });

  test('PUT 5.0 - сохранение изменений  @PUT', async () => {

    const updateData = new TodoBuilder().withTitle('Проверка сохранения').build();

    
    const updateResponse = await apiClient.updateTodo(existingTodoId, updateData);
    expect(updateResponse.status()).toBe(200);

   
    const getResponse = await apiClient.getTodoById(existingTodoId);
    expect(getResponse.status()).toBe(200);
    
    const retrievedTodo = await getResponse.json();
    expect(retrievedTodo.title).toBe('Проверка сохранения');
  });
});

// PATCH запросы

test.describe('PATCH запросы', () => {
  let existingTodoId;

  test.beforeEach(async () => {
    const testTodo = new TodoBuilder()
      .withTitle('задача для patch запроса')
      .withDescription('описание для patch запроса')
      .withDoneStatus(false)
      .build();
    
    const createResponse = await apiClient.createTodo(testTodo);
    const createdTodo = await createResponse.json();
    existingTodoId = createdTodo.id;
  });

  test('PATCH 1.0 - частичное обновление @PATCH', async () => {
    const partialUpdate = { doneStatus: true };

    const response = await apiClient.request.patch(`/todos/${existingTodoId}`, {
      data: partialUpdate
    });
    
    expect(response.status()).toBe(200);
    
    const updatedTodo = await response.json();

    expect(updatedTodo.doneStatus).toBe(true);
    expect(updatedTodo.title).toBe('задача для patch запроса'); 
    expect(updatedTodo.description).toBe('описание для patch запроса'); 
  });

  test('PATCH 2.0 - обновление нескольких полей @PATCH', async () => {
  
    const partialUpdate = {
      title: 'тест обновления c patch',
      description: 'тест обновления с patch'
    };

    const response = await apiClient.request.patch(`/todos/${existingTodoId}`, {
      data: partialUpdate
    });
    
    expect(response.status()).toBe(200);
    
    const updatedTodo = await response.json();
    expect(updatedTodo.title).toBe('тест обновления c patch');
    expect(updatedTodo.description).toBe('тест обновления с patch');
    expect(updatedTodo.doneStatus).toBe(false); 
  });

  test('PATCH 3.0 -  пустой запрос @PATCH', async () => {
  
    const emptyUpdate = {};

    const response = await apiClient.request.patch(`/todos/${existingTodoId}`, {
      data: emptyUpdate
    });
    
  
    expect([200, 400]).toContain(response.status());
  });

  test('PATCH 4.0 валидация @PATCH', async () => {

    const invalidUpdate = { title: '' }; 

    const response = await apiClient.request.patch(`/todos/${existingTodoId}`, {
      data: invalidUpdate
    });
    
    expect(response.status()).toBe(400);
  });

  test('PATCH 5.0 обновление несуществующей записи @PATCH', async () => {
   
    const partialUpdate = { title: 'нет такой запипси' };

    const response = await apiClient.request.patch('/todos/999999', {
      data: partialUpdate
    });
    
    expect(response.status()).toBe(404);
  });
});

//  DELETE запросы

test.describe('DELETE запросы', () => {
  
  test('DELETE 1.0 удаление записи  @DELETE ', async () => {

    const testTodo = new TodoBuilder().build();
    const createResponse = await apiClient.createTodo(testTodo);
    const createdTodo = await createResponse.json();

    
    const deleteResponse = await apiClient.deleteTodo(createdTodo.id);
    expect(deleteResponse.status()).toBe(200);


    const getResponse = await apiClient.getTodoById(createdTodo.id);
    expect(getResponse.status()).toBe(404);
  });

  test('DELETE 2.0 -  удаление несуществующей записи @DELETE', async () => {
   
    const response = await apiClient.deleteTodo(999999);
    
    expect([200, 404]).toContain(response.status());
  });

  test('DELETE 3.0 двойное удаление @DELETE', async () => {
 
    const testTodo = new TodoBuilder().build();
    const createResponse = await apiClient.createTodo(testTodo);
    const createdTodo = await createResponse.json();

   
    const deleteResponse1 = await apiClient.deleteTodo(createdTodo.id);
    const deleteResponse2 = await apiClient.deleteTodo(createdTodo.id);
    
  
    expect(deleteResponse1.status() === 200 || deleteResponse2.status() === 200).toBe(true);
  });

  test('DELETE 4.0  проверка данных после удаления @DELETE', async () => {

    const testTodo = new TodoBuilder().build();
    const createResponse = await apiClient.createTodo(testTodo);
    const createdTodo = await createResponse.json();

 
    const initialGet = await apiClient.getTodoById(createdTodo.id);
    expect(initialGet.status()).toBe(200);

   
    await apiClient.deleteTodo(createdTodo.id);

   
    const finalGet = await apiClient.getTodoById(createdTodo.id);
    expect(finalGet.status()).toBe(404);
  });
});
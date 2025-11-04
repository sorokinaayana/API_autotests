import { test, expect } from '@playwright/test';
import { ApiClient } from '../index.js';
import { TodoBuilder } from '../builders/todo.builder.js';

let apiClient;
let token;

test.beforeAll(async ({ request }) => {
  const response = await request.post('https://apichallenges.herokuapp.com/challenger');
  const headers = response.headers();
  token = headers['x-challenger'];
  console.log('Токен: ' + token);
});

test.beforeEach(async ({ request }) => {
  apiClient = new ApiClient(request, token);
});

// GET запросы 
test.describe('GET запросы', () => {
  
  test('GET 1.0 - получение всех данных @GET', async () => {
    const response = await apiClient.getAllTodos();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.todos)).toBe(true);
    expect(data.todos.length).toBeGreaterThan(0);
    
    const firstTodo = data.todos[0];
    expect(firstTodo).toHaveProperty('id');
    expect(firstTodo).toHaveProperty('title');
    expect(firstTodo).toHaveProperty('doneStatus');
    expect(typeof firstTodo.doneStatus).toBe('boolean');
  });

  test('GET 2.0 - получение по id @GET', async () => {
    const testTodo = new TodoBuilder().withTitle('Поиск по ID тест').build();
    const createResponse = await apiClient.createTodo(testTodo);
    const createdTodo = await createResponse.json();

    const response = await apiClient.getTodoById(createdTodo.id);
    expect(response.status()).toBe(200);
    
    const foundData = await response.json();
  
    expect(foundData.todos).toBeDefined();
    expect(foundData.todos.length).toBe(1);
    
    const foundTodo = foundData.todos[0];
    expect(foundTodo.id).toBe(createdTodo.id);
    expect(foundTodo.title).toBe('Поиск по ID тест');
  });

  test('GET 3.0 - получение несуществующей записи @GET', async () => {
    const response = await apiClient.getTodoById(999999);
    expect(response.status()).toBe(404);
  });

  test('GET 4.0 - фильтрация по статусу true @GET', async () => {
    const response = await apiClient.getTodosWithFilter('true');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    if (data.todos.length > 0) {
      data.todos.forEach(todo => {
        expect(todo.doneStatus).toBe(true);
      });
    }
  });

  test('GET 5.0 - фильтрация по статусу false @GET', async () => {
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

  test('GET 7.0 - обработка пустого списка @GET', async () => {
    const response = await apiClient.getAllTodos();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.todos)).toBe(true);
  });

  test('GET 8.0 - проверка пагинации @GET', async () => {
    const response = await apiClient.request.get(`${apiClient.baseURL}/todos?page=1&limit=5`, {
      headers: {
        'X-Challenger': token,
      }
    });
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.todos.length).toBeGreaterThan(0);
  });
});

// POST запросы
test.describe('POST запросы', () => {
  
  test('POST 1.0 - создание со всеми параметрами @POST', async () => {
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

  test('POST 2.0 - создание с минимальными параметрами @POST', async () => {
    const minimalTodo = { title: 'Тест мин. набор' };

    const response = await apiClient.createTodo(minimalTodo);
    expect(response.status()).toBe(201);
    
    const createdTodo = await response.json();
    expect(createdTodo.title).toBe('Тест мин. набор');
    expect(createdTodo.doneStatus).toBe(false);
  });

  test('POST 3.0 - валидация пустого заголовка @POST', async () => {
    const invalidTodo = { title: '' };

    const response = await apiClient.createTodo(invalidTodo);
    expect(response.status()).toBe(400);
  });

  test('POST 4.0 - валидация отсутствия заголовка @POST', async () => {
    const invalidTodo = { description: 'Проверка без заголовка' };

    const response = await apiClient.createTodo(invalidTodo);
    expect(response.status()).toBe(400);
  });

  test('POST 5.0 - создание с спецсимволами @POST', async () => {
    const specialTodo = {
      title: 'Название с спецсимволами:测试 0!@#$%',
      description: 'Описание ><:='
    };

    const response = await apiClient.createTodo(specialTodo);
    expect(response.status()).toBe(201);
    
    const createdTodo = await response.json();
    expect(createdTodo.title).toBe('Название с спецсимволами:测试 0!@#$%');
  });

  test('POST 6.0 - граничные значения @POST', async () => {
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

  test('POST 7.0 - множественное создание @POST', async () => {
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
});

// PUT запросы
test.describe('PUT запросы', () => {
  let existingTodoId;

  test.beforeEach(async () => {
    const testTodo = new TodoBuilder().withTitle('Начальная запись').build();
    const createResponse = await apiClient.createTodo(testTodo);
    const createdTodo = await createResponse.json();
    existingTodoId = createdTodo.id;
  });

  test('PUT 1.0 - полное обновление @PUT', async () => {
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

  test('PUT 2.0 - перезапись @PUT', async () => {
    const updateData = { title: 'Только название поменяем' };

    const response = await apiClient.updateTodo(existingTodoId, updateData);
    expect(response.status()).toBe(200);
    
    const updatedTodo = await response.json();
    expect(updatedTodo.title).toBe('Только название поменяем');
  });

  test('PUT 3.0 - обновление несуществующей записи @PUT', async () => {
    const updateData = new TodoBuilder().build();
    const response = await apiClient.updateTodo(999999, updateData);
   
    expect(response.status()).toBe(400);
  });
});

// DELETE запросы
test.describe('DELETE запросы', () => {
  
  test('DELETE 1.0 - удаление записи @DELETE', async () => {
    const testTodo = new TodoBuilder().build();
    const createResponse = await apiClient.createTodo(testTodo);
    const createdTodo = await createResponse.json();

    const deleteResponse = await apiClient.deleteTodo(createdTodo.id);
   
    expect(deleteResponse.status()).toBe(404);

    const getResponse = await apiClient.getTodoById(createdTodo.id);
    expect(getResponse.status()).toBe(404);
  });

  test('DELETE 2.0 - удаление несуществующей записи @DELETE', async () => {
    const response = await apiClient.deleteTodo(999999);
    expect(response.status()).toBe(404);
  });
});



// Дополнительные кейсы 
test.describe('GET тесты', () => {
  
  test('GET 9.0 - проверка структуры todo объекта @GET', async () => {
    const response = await apiClient.getAllTodos();
    const data = await response.json();
    
    if (data.todos.length > 0) {
      const todo = data.todos[0];
      expect(todo).toHaveProperty('id');
      expect(todo).toHaveProperty('title');
      expect(todo).toHaveProperty('doneStatus');
      expect(todo).toHaveProperty('description');
      expect(typeof todo.id).toBe('number');
      expect(typeof todo.title).toBe('string');
      expect(typeof todo.doneStatus).toBe('boolean');
      expect(typeof todo.description).toBe('string');
    }
  });

  test('GET 10.0 - получение todo с минимальным ID @GET', async () => {
    const response = await apiClient.getAllTodos();
    const data = await response.json();
    
    if (data.todos.length > 0) {
      const minIdTodo = data.todos.reduce((min, todo) => todo.id < min.id ? todo : min);
      const responseById = await apiClient.getTodoById(minIdTodo.id);
      expect(responseById.status()).toBe(200);
      
      const todoData = await responseById.json();
      expect(todoData.todos[0].id).toBe(minIdTodo.id);
    }
  });

  test('GET 11.0 - проверка заголовков ответа @GET', async () => {
    const response = await apiClient.getAllTodos();
    const headers = response.headers();
    
    expect(headers['content-type']).toContain('application/json');
    expect(headers['x-challenger']).toBe(token);
    expect(response.status()).toBe(200);
  });
});


test.describe(' POST тесты', () => {
  
  test('POST 8.0 - создание с максимальной длиной заголовка @POST', async () => {
    // Максимальная длина title в API Challenges - 50 символов
    const maxTitle = '1'.repeat(50);
    const testTodo = { title: maxTitle };

    const response = await apiClient.createTodo(testTodo);
    expect(response.status()).toBe(201);
    
    const createdTodo = await response.json();
    expect(createdTodo.title).toBe(maxTitle);
    expect(createdTodo.title.length).toBe(50);
  });

  test('POST 9.0 - создание с максимальной длиной description @POST', async () => {
  
    const maxDescription = 'B'.repeat(200);
    const testTodo = {
      title: 'Тест с макс. описанием',
      description: maxDescription
    };

    const response = await apiClient.createTodo(testTodo);
    expect(response.status()).toBe(201);
    
    const createdTodo = await response.json();
    expect(createdTodo.description).toBe(maxDescription);
    expect(createdTodo.description.length).toBe(201);
  }); 

  test('POST 10.0 - создание с doneStatus=false @POST', async () => {
    const testTodo = {
      title: 'Тест с doneStatus false',
      doneStatus: false
    };

    const response = await apiClient.createTodo(testTodo);
    expect(response.status()).toBe(201);
    
    const createdTodo = await response.json();
    expect(createdTodo.doneStatus).toBe(false);
  });

  test('POST 11.0 - создание с doneStatus=true @POST', async () => {
    const testTodo = {
      title: 'Тест с doneStatus true',
      doneStatus: true
    };

    const response = await apiClient.createTodo(testTodo);
    expect(response.status()).toBe(201);
    
    const createdTodo = await response.json();
    expect(createdTodo.doneStatus).toBe(true);
  });
});

test.describe(' PUT тесты', () => {
  let existingTodoId;

  test.beforeEach(async () => {
    const testTodo = new TodoBuilder()
      .withTitle('доп пут пут')
      .withDescription('Тестовое описание')
      .withDoneStatus(false)
      .build();
    
    const createResponse = await apiClient.createTodo(testTodo);
    const createdTodo = await createResponse.json();
    existingTodoId = createdTodo.id;
  });

  test('PUT 4.0 - обновление только description @PUT', async () => {
    const updateData = {
      title: 'доп пут пут', 
      description: 'Обновленное описание'
    };

    const response = await apiClient.updateTodo(existingTodoId, updateData);
    expect(response.status()).toBe(200);
    
    const updatedTodo = await response.json();
    expect(updatedTodo.description).toBe('Обновленное описание');
    expect(updatedTodo.title).toBe('доп пут пут');
  });

  test('PUT 5.0 - обновление только doneStatus @PUT', async () => {
    const updateData = {
      title: 'доп пут пут', 
      doneStatus: true
    };

    const response = await apiClient.updateTodo(existingTodoId, updateData);
    expect(response.status()).toBe(200);
    
    const updatedTodo = await response.json();
    expect(updatedTodo.doneStatus).toBe(true);
    expect(updatedTodo.title).toBe('доп пут пут');
  });
});

//  тесты валидации
test.describe('Тесты валидации', () => {
  
  test('VALIDATION 1.0 - создание с слишком длинным title @POST', async () => {
    const tooLongTitle = 'A'.repeat(51); 
    const testTodo = { title: tooLongTitle };

    const response = await apiClient.createTodo(testTodo);
    expect(response.status()).toBe(400);
  });

  test('VALIDATION 2.0 - создание с неверным типом doneStatus @POST', async () => {
    const testTodo = {
      title: 'Тест с неверным doneStatus',
      doneStatus: '1111boolean' 
    };

    const response = await apiClient.createTodo(testTodo);
    expect(response.status()).toBe(400);
  });
});

// Тесты на граничные значения
test.describe('Граничные случаи', () => {
  
  test('Граничные 1.0 - создание  с очень коротким title @POST', async () => {
    const shortTitle = '1';
    const testTodo = { title: shortTitle };

    const response = await apiClient.createTodo(testTodo);
    expect(response.status()).toBe(201);
    
    const createdTodo = await response.json();
    expect(createdTodo.title).toBe(shortTitle);
  });

  test('Граничные 2.0 - создание  с пустым description @POST', async () => {
    const testTodo = {
      title: 'Тест с пустым описанием',
      description: ''
    };

    const response = await apiClient.createTodo(testTodo);
    expect(response.status()).toBe(201);
    
    const createdTodo = await response.json();
    expect(createdTodo.description).toBe('');
  });
});

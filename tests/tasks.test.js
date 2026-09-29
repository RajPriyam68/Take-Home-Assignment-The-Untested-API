const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('GET /tasks returns all tasks', async () => {
    taskService.create({ title: 'A' });
    taskService.create({ title: 'B' });

    const res = await request(app).get('/tasks');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('GET /tasks?status=todo filters by status', async () => {
    taskService.create({ title: 'Todo', status: 'todo' });
    taskService.create({ title: 'Done', status: 'done' });

    const res = await request(app).get('/tasks?status=todo');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('todo');
  });

  test('GET /tasks?page=1&limit=2 returns the first page', async () => {
    taskService.create({ title: 'A' });
    taskService.create({ title: 'B' });
    taskService.create({ title: 'C' });

    const res = await request(app).get('/tasks?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.title)).toEqual(['A', 'B']);
  });

  test('GET /tasks?page=2&limit=2 returns the second page', async () => {
    taskService.create({ title: 'A' });
    taskService.create({ title: 'B' });
    taskService.create({ title: 'C' });

    const res = await request(app).get('/tasks?page=2&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.title)).toEqual(['C']);
  });

  test('POST /tasks creates a task', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Write tests', priority: 'high' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Write tests',
      priority: 'high',
      status: 'todo',
    });
    expect(res.body.id).toEqual(expect.any(String));
  });

  test('POST /tasks rejects an empty title', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title is required/i);
  });

  test('PUT /tasks/:id updates a task', async () => {
    const task = taskService.create({ title: 'Old' });

    const res = await request(app)
      .put(`/tasks/${task.id}`)
      .send({ title: 'New', priority: 'high' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: task.id,
      title: 'New',
      priority: 'high',
    });
  });

  test('PUT /tasks/:id returns 404 for an unknown task', async () => {
    const res = await request(app)
      .put('/tasks/missing')
      .send({ title: 'New' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Task not found' });
  });

  test('DELETE /tasks/:id deletes a task', async () => {
    const task = taskService.create({ title: 'Delete me' });

    const res = await request(app).delete(`/tasks/${task.id}`);

    expect(res.status).toBe(204);
    expect(taskService.findById(task.id)).toBeUndefined();
  });

  test('DELETE /tasks/:id returns 404 for an unknown task', async () => {
    const res = await request(app).delete('/tasks/missing');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Task not found' });
  });

  test('PATCH /tasks/:id/complete marks a task complete', async () => {
    const task = taskService.create({ title: 'Complete me', priority: 'high' });

    const res = await request(app).patch(`/tasks/${task.id}/complete`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).toEqual(expect.any(String));
  });

  test('PATCH /tasks/:id/complete returns 404 for an unknown task', async () => {
    const res = await request(app).patch('/tasks/missing/complete');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Task not found' });
  });

  test('GET /tasks/stats returns status and overdue counts', async () => {
    taskService.create({ title: 'Todo' });
    taskService.create({ title: 'Done', status: 'done' });
    taskService.create({
      title: 'Overdue',
      dueDate: '2000-01-01T00:00:00.000Z',
    });

    const res = await request(app).get('/tasks/stats');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      todo: 2,
      in_progress: 0,
      done: 1,
      overdue: 1,
    });
  });

  test('PATCH /tasks/:id/assign assigns an unassigned task', async () => {
    const task = taskService.create({ title: 'Assign me' });

    const res = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({ assignee: ' Raj ' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: task.id,
      assignee: 'Raj',
    });
  });

  test('PATCH /tasks/:id/assign returns 404 for an unknown task', async () => {
    const res = await request(app)
      .patch('/tasks/missing/assign')
      .send({ assignee: 'Raj' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Task not found' });
  });

  test('PATCH /tasks/:id/assign rejects a missing assignee', async () => {
    const task = taskService.create({ title: 'Assign me' });

    const res = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/assignee is required/i);
  });

  test('PATCH /tasks/:id/assign rejects an empty assignee', async () => {
    const task = taskService.create({ title: 'Assign me' });

    const res = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({ assignee: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/assignee is required/i);
  });

  test('PATCH /tasks/:id/assign rejects a non-string assignee', async () => {
    const task = taskService.create({ title: 'Assign me' });

    const res = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({ assignee: 123 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/assignee is required/i);
  });

  test('PATCH /tasks/:id/assign returns 409 when already assigned', async () => {
    const task = taskService.create({ title: 'Assigned' });
    taskService.assignTask(task.id, 'Raj');

    const res = await request(app)
      .patch(`/tasks/${task.id}/assign`)
      .send({ assignee: 'Asha' });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      error: 'Task is already assigned',
      task: expect.objectContaining({ assignee: 'Raj' }),
    });
  });
});

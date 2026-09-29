const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('create creates a task with defaults', () => {
    const task = taskService.create({ title: 'First task' });

    expect(task).toMatchObject({
      title: 'First task',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      completedAt: null,
    });
    expect(task.id).toEqual(expect.any(String));
    expect(task.createdAt).toEqual(expect.any(String));
  });

  test('getAll returns all tasks without exposing the internal array', () => {
    taskService.create({ title: 'A' });
    taskService.create({ title: 'B' });

    const tasks = taskService.getAll();
    expect(tasks).toHaveLength(2);
    expect(tasks).not.toBe(taskService.getAll());
  });

  test('findById returns a matching task or undefined', () => {
    const created = taskService.create({ title: 'Find me' });

    expect(taskService.findById(created.id)).toEqual(created);
    expect(taskService.findById('missing')).toBeUndefined();
  });

  test('getByStatus filters tasks by status', () => {
    taskService.create({ title: 'Todo', status: 'todo' });
    taskService.create({ title: 'Done', status: 'done' });

    expect(taskService.getByStatus('todo')).toHaveLength(1);
    expect(taskService.getByStatus('todo')[0].title).toBe('Todo');
  });

  test('getPaginated treats page numbers as 1-based', () => {
    const created = ['A', 'B', 'C'].map((title) => taskService.create({ title }));

    expect(taskService.getPaginated(1, 2)).toEqual(created.slice(0, 2));
    expect(taskService.getPaginated(2, 2)).toEqual(created.slice(2, 3));
  });

  test('getPaginated returns an empty array beyond the last page', () => {
    taskService.create({ title: 'Only task' });

    expect(taskService.getPaginated(3, 10)).toEqual([]);
  });

  test('getStats counts statuses and overdue incomplete tasks', () => {
    taskService.create({ title: 'Todo' });
    taskService.create({ title: 'Done', status: 'done' });
    taskService.create({
      title: 'Overdue',
      dueDate: '2000-01-01T00:00:00.000Z',
    });

    expect(taskService.getStats()).toEqual({
      todo: 2,
      in_progress: 0,
      done: 1,
      overdue: 1,
    });
  });

  test('update updates an existing task and preserves other fields', () => {
    const created = taskService.create({ title: 'Old', priority: 'high' });

    const updated = taskService.update(created.id, { title: 'New' });

    expect(updated).toMatchObject({
      id: created.id,
      title: 'New',
      priority: 'high',
    });
    expect(taskService.update('missing', { title: 'Nope' })).toBeNull();
  });

  test('remove deletes an existing task', () => {
    const created = taskService.create({ title: 'Delete me' });

    expect(taskService.remove(created.id)).toBe(true);
    expect(taskService.findById(created.id)).toBeUndefined();
    expect(taskService.remove('missing')).toBe(false);
  });

  test('completeTask marks a task done and records completion time', () => {
    const created = taskService.create({ title: 'Complete me', priority: 'high' });

    const completed = taskService.completeTask(created.id);

    expect(completed.status).toBe('done');
    expect(completed.completedAt).toEqual(expect.any(String));
    expect(completed.priority).toBe('medium');
    expect(taskService.completeTask('missing')).toBeNull();
  });

  test('assignTask stores an assignee', () => {
    const created = taskService.create({ title: 'Assign me' });

    const updated = taskService.assignTask(created.id, 'Raj');

    expect(updated).toMatchObject({
      id: created.id,
      assignee: 'Raj',
    });
  });

  test('assignTask returns null for a missing task', () => {
    expect(taskService.assignTask('missing', 'Raj')).toBeNull();
  });

  test('assignTask reports a conflict when already assigned', () => {
    const created = taskService.create({ title: 'Assigned' });
    taskService.assignTask(created.id, 'Raj');

    const result = taskService.assignTask(created.id, 'Asha');

    expect(result).toMatchObject({
      conflict: true,
      task: expect.objectContaining({ assignee: 'Raj' }),
    });
  });
});

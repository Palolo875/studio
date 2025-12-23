/**
 * Database Integration Tests
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    db,
    createTask,
    getTodoTasks,
    getTasksByStatus,
    completeTask,
    updateTask,
    deleteTask,
    createSession,
    getSessionsByDate,
    addTaskHistory,
    getTaskHistory,
    type DBTask,
} from '../index';

describe('Database', () => {
    beforeEach(async () => {
        // Clear database before each test
        await db.tasks.clear();
        await db.sessions.clear();
        await db.taskHistory.clear();
        await db.userPatterns.clear();
        await db.overrides.clear();
        await db.sleepData.clear();
    });

    afterEach(async () => {
        // Cleanup after tests
        await db.tasks.clear();
        await db.sessions.clear();
        await db.taskHistory.clear();
    });

    describe('Task Operations', () => {
        const sampleTask: Omit<DBTask, 'createdAt' | 'updatedAt' | 'activationCount'> = {
            id: 'task-1',
            title: 'Test Task',
            description: 'A test task',
            duration: 30,
            effort: 'medium',
            urgency: 'medium',
            impact: 'medium',
            category: 'test',
            status: 'todo',
            tags: ['test'],
        };

        it('should create a task', async () => {
            const task = await createTask(sampleTask);

            expect(task.id).toBe('task-1');
            expect(task.title).toBe('Test Task');
            expect(task.activationCount).toBe(0);
            expect(task.createdAt).toBeDefined();
            expect(task.updatedAt).toBeDefined();
        });

        it('should get todo tasks', async () => {
            await createTask(sampleTask);
            await createTask({
                ...sampleTask,
                id: 'task-2',
                status: 'done',
            });

            const todoTasks = await getTodoTasks();

            expect(todoTasks).toHaveLength(1);
            expect(todoTasks[0].id).toBe('task-1');
        });

        it('should get tasks by status', async () => {
            await createTask(sampleTask);
            await createTask({
                ...sampleTask,
                id: 'task-2',
                status: 'active',
            });

            const activeTasks = await getTasksByStatus('active');

            expect(activeTasks).toHaveLength(1);
            expect(activeTasks[0].id).toBe('task-2');
        });

        it('should update a task', async () => {
            await createTask(sampleTask);
            await updateTask('task-1', { title: 'Updated Title' });

            const tasks = await db.tasks.get('task-1');

            expect(tasks?.title).toBe('Updated Title');
        });

        it('should complete a task', async () => {
            await createTask(sampleTask);
            await completeTask('task-1');

            const task = await db.tasks.get('task-1');

            expect(task?.status).toBe('done');
            expect(task?.completedAt).toBeDefined();
        });

        it('should delete a task', async () => {
            await createTask(sampleTask);
            await deleteTask('task-1');

            const task = await db.tasks.get('task-1');

            expect(task).toBeUndefined();
        });
    });

    describe('Session Operations', () => {
        it('should create a session', async () => {
            const session = await createSession({
                id: 'session-1',
                timestamp: Date.now(),
                startTime: Date.now(),
                plannedTasks: 3,
                completedTasks: 0,
                state: 'PLANNED',
                taskIds: ['task-1', 'task-2'],
            });

            expect(session.id).toBe('session-1');
            expect(session.createdAt).toBeDefined();
        });

        it('should get sessions by date', async () => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            await createSession({
                id: 'session-today',
                timestamp: today.getTime(),
                startTime: today.getTime(),
                plannedTasks: 3,
                completedTasks: 0,
                state: 'PLANNED',
                taskIds: [],
            });

            await createSession({
                id: 'session-yesterday',
                timestamp: yesterday.getTime(),
                startTime: yesterday.getTime(),
                plannedTasks: 2,
                completedTasks: 2,
                state: 'COMPLETED',
                taskIds: [],
            });

            const todaySessions = await getSessionsByDate(today);

            expect(todaySessions).toHaveLength(1);
            expect(todaySessions[0].id).toBe('session-today');
        });
    });

    describe('Task History', () => {
        it('should add history entry when task is created', async () => {
            await createTask({
                id: 'task-1',
                title: 'Test Task',
                duration: 30,
                effort: 'medium',
                urgency: 'medium',
                impact: 'medium',
                category: 'test',
                status: 'todo',
            });

            const history = await getTaskHistory('task-1');

            expect(history).toHaveLength(1);
            expect(history[0].action).toBe('created');
        });

        it('should add history entry when task is completed', async () => {
            await createTask({
                id: 'task-1',
                title: 'Test Task',
                duration: 30,
                effort: 'medium',
                urgency: 'medium',
                impact: 'medium',
                category: 'test',
                status: 'todo',
            });

            await completeTask('task-1');

            const history = await getTaskHistory('task-1');

            expect(history).toHaveLength(2);
            expect(history.some(h => h.action === 'completed')).toBe(true);
        });
    });
});

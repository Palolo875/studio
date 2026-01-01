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
    recordTaskProposals,
    recordTaskSkips,
    updateTask,
    deleteTask,
    createSession,
    getSessionsByDate,
    addTaskHistory,
    getTaskHistory,
    type DBTask,
    type DBTaskHistory,
} from './index';

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

        it('should not clear nlpHints or tags when updateTask is called with undefined fields', async () => {
            await createTask({
                ...sampleTask,
                nlpHints: {
                    detectedLang: 'fr',
                    confidence: 0.5,
                    isUncertain: true,
                    rawText: 'Appeler Marc',
                },
                tags: ['keep'],
            });

            await updateTask('task-1', {
                title: 'Updated Title',
                nlpHints: undefined,
                tags: undefined,
            });

            const task = await db.tasks.get('task-1');
            expect(task?.title).toBe('Updated Title');
            expect(task?.nlpHints?.rawText).toBe('Appeler Marc');
            expect(task?.tags).toEqual(['keep']);
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
            expect(history.some((h: DBTaskHistory) => h.action === 'completed')).toBe(true);
        });

        it('should store completion metadata when provided', async () => {
            await createTask({
                id: 'task-meta',
                title: 'Task with metadata',
                duration: 30,
                effort: 'medium',
                urgency: 'medium',
                impact: 'medium',
                category: 'test',
                status: 'todo',
            });

            await completeTask('task-meta', { duration: 42, energyLevel: 'low', sessionId: 'session-x' });

            const history = await getTaskHistory('task-meta');
            const completed = history.find((h: DBTaskHistory) => h.action === 'completed');
            expect(completed).toBeDefined();
            expect(completed?.duration).toBe(42);
            expect(completed?.energyLevel).toBe('low');
            expect(completed?.sessionId).toBe('session-x');
        });

        it('should record task proposals in history', async () => {
            await createTask({
                id: 'task-prop',
                title: 'Proposed task',
                duration: 30,
                effort: 'medium',
                urgency: 'medium',
                impact: 'medium',
                category: 'test',
                status: 'todo',
            });

            await recordTaskProposals(['task-prop'], 'session-prop');

            const history = await getTaskHistory('task-prop');
            expect(history.some((h: DBTaskHistory) => h.action === 'proposed')).toBe(true);
            const proposed = history.find((h: DBTaskHistory) => h.action === 'proposed');
            expect(proposed?.sessionId).toBe('session-prop');
        });

        it('should record task skips in history', async () => {
            await createTask({
                id: 'task-skip',
                title: 'Skipped task',
                duration: 30,
                effort: 'medium',
                urgency: 'medium',
                impact: 'medium',
                category: 'test',
                status: 'todo',
            });

            await recordTaskSkips(['task-skip'], 'session-skip');

            const history = await getTaskHistory('task-skip');
            expect(history.some((h: DBTaskHistory) => h.action === 'skipped')).toBe(true);
            const skipped = history.find((h: DBTaskHistory) => h.action === 'skipped');
            expect(skipped?.sessionId).toBe('session-skip');
        });
    });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/database';
import { validateDataIntegrity, performStartupIntegrityCheck } from '@/lib/dataIntegrityValidator';

function makeTask(overrides: Record<string, unknown> = {}) {
    return {
        id: 'task-1',
        title: 'Task',
        description: '',
        duration: 30,
        effort: 'medium',
        urgency: 'medium',
        impact: 'medium',
        category: 'test',
        status: 'todo',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        activationCount: 0,
        ...overrides,
    };
}

function makeSession(overrides: Record<string, unknown> = {}) {
    return {
        id: 'session-1',
        timestamp: Date.now(),
        startTime: Date.now(),
        plannedTasks: 1,
        completedTasks: 0,
        state: 'PLANNED',
        taskIds: ['task-1'],
        createdAt: new Date(),
        ...overrides,
    };
}

describe('Phase 5 — Data integrity validator', () => {
    beforeEach(async () => {
        await db.tasks.clear();
        await db.sessions.clear();
        await db.taskHistory.clear();
        await db.overrides.clear();
        await db.sleepData.clear();
        await db.brainDecisions.clear();
        await db.decisionExplanations.clear();
        await (db as any).eveningEntries?.clear?.();
        await (db as any).settings?.clear?.();
    });

    it('validateDataIntegrity returns valid for a consistent DB', async () => {
        await db.tasks.put(makeTask());
        await db.sessions.put(makeSession());

        const report = await validateDataIntegrity(db);
        expect(report.valid).toBe(true);
        expect(report.errors).toEqual([]);
    });

    it('validateDataIntegrity detects orphan references inside session.taskIds', async () => {
        await db.tasks.put(makeTask({ id: 'task-1' }));
        await db.sessions.put(makeSession({ taskIds: ['task-1', 'missing-task'] }));

        const report = await validateDataIntegrity(db);
        expect(report.valid).toBe(false);
        expect(report.errors.some((e) => e.type === 'INVALID_REFERENCE')).toBe(true);
    });

    it('performStartupIntegrityCheck repairs invalid references by removing missing taskIds', async () => {
        await db.tasks.put(makeTask({ id: 'task-1' }));
        await db.sessions.put(makeSession({ taskIds: ['task-1', 'missing-task'] }));

        await performStartupIntegrityCheck(db);

        const session = await db.sessions.get('session-1');
        expect(session).toBeDefined();
        expect(session?.taskIds).toEqual(['task-1']);

        const report = await validateDataIntegrity(db);
        expect(report.valid).toBe(true);
    });

    it('performStartupIntegrityCheck repairs invalid task status by resetting to todo', async () => {
        await db.tasks.put(makeTask({ status: 'broken' }));
        await db.sessions.put(makeSession());

        await performStartupIntegrityCheck(db);

        const task = await db.tasks.get('task-1');
        expect(task?.status).toBe('todo');

        const report = await validateDataIntegrity(db);
        expect(report.valid).toBe(true);
    });
});

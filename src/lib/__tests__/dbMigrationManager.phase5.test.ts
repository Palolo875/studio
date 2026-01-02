import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/database';
import { migrateWithRollback, type Migration } from '@/lib/dbMigrationManager';

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

describe('Phase 5 — DB migration with rollback', () => {
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

    it('migrateWithRollback returns success when migration succeeds', async () => {
        await db.tasks.put(makeTask({ id: 'task-1' }));

        const migration: Migration = {
            version: 999,
            name: 'noop',
            up: async () => {
                await db.tasks.put(makeTask({ id: 'task-2' }));
            },
        };

        const result = await migrateWithRollback(db, migration);
        expect(result.success).toBe(true);
        expect(result.backupCreated).toBe(true);

        const task2 = await db.tasks.get('task-2');
        expect(task2).toBeDefined();
    });

    it('migrateWithRollback performs rollback when migration throws', async () => {
        await db.tasks.put(makeTask({ id: 'task-1' }));

        const migration: Migration = {
            version: 999,
            name: 'throw',
            up: async () => {
                await db.tasks.put(makeTask({ id: 'task-2' }));
                throw new Error('boom');
            },
        };

        const result = await migrateWithRollback(db, migration);
        expect(result.success).toBe(false);
        expect(result.backupCreated).toBe(true);

        const task1 = await db.tasks.get('task-1');
        const task2 = await db.tasks.get('task-2');
        expect(task1).toBeDefined();
        expect(task2).toBeUndefined();
    });

    it('migrateWithRollback rolls back when migration makes DB inconsistent (post-migration integrity check)', async () => {
        // Baseline consistent state
        await db.tasks.put(makeTask({ id: 'task-1' }));

        const migration: Migration = {
            version: 999,
            name: 'corrupt-data',
            up: async () => {
                // Create an inconsistent state that validateDataIntegrity should flag
                await db.tasks.put(makeTask({ id: 'task-bad', status: 'broken' }));
            },
        };

        const result = await migrateWithRollback(db, migration);
        expect(result.success).toBe(false);

        const bad = await db.tasks.get('task-bad');
        expect(bad).toBeUndefined();
        expect(await db.tasks.get('task-1')).toBeDefined();
    });
});

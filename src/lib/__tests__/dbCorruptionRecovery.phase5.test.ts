import { describe, it, expect } from 'vitest';
import { openDbWithCorruptionRecovery } from '@/lib/dbCorruptionRecovery';

function makeUnknownError(): Error {
    const err = new Error('corrupted');
    (err as any).name = 'UnknownError';
    return err;
}

describe('Phase 5 — DB corruption recovery', () => {
    it('openDbWithCorruptionRecovery rethrows non-corruption errors', async () => {
        const dbMock = {
            open: async () => {
                const err = new Error('some other error');
                (err as any).name = 'QuotaExceededError';
                throw err;
            },
        };

        await expect(openDbWithCorruptionRecovery(dbMock as any)).rejects.toThrow('some other error');
    });

    it('openDbWithCorruptionRecovery attempts recovery on UnknownError corruption', async () => {
        let deleted = 0;
        let opened = 0;

        const dbMock = {
            open: async () => {
                opened += 1;
                if (opened === 1) throw makeUnknownError();
                return dbMock;
            },
            delete: async () => {
                deleted += 1;
            },
            close: async () => {
                // noop
            },
            tasks: {
                limit: () => ({
                    toArray: async () => [],
                }),
            },
        };

        const openedDb = await openDbWithCorruptionRecovery(dbMock as any);
        expect(openedDb).toBe(dbMock);
        expect(deleted).toBe(1);
        expect(opened).toBe(2);
    });
});

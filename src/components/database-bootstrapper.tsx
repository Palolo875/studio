'use client';

import { useEffect } from 'react';
import { db } from '@/lib/database';
import { createLocalBackupSnapshot, openDbWithCorruptionRecovery, performPeriodicHealthCheck } from '@/lib/dbCorruptionRecovery';
import { performStartupIntegrityCheck } from '@/lib/dataIntegrityValidator';
import { storageGuard } from '@/lib/storageGuard';
import { createLogger } from '@/lib/logger';

const logger = createLogger('DatabaseBootstrapper');

export function DatabaseBootstrapper() {
  useEffect(() => {
    let cancelled = false;
    let healthInterval: ReturnType<typeof setInterval> | undefined;
    let growthInterval: ReturnType<typeof setInterval> | undefined;
    let backupInterval: ReturnType<typeof setInterval> | undefined;
    let pruneInterval: ReturnType<typeof setInterval> | undefined;

    async function bootstrap() {
      try {
        await openDbWithCorruptionRecovery(db);
      } catch (error) {
        logger.error('DB bootstrap failed', error as Error);
        return;
      }

      if (cancelled) return;

      try {
        await performStartupIntegrityCheck(db);
      } catch (error) {
        logger.warn('Startup integrity check failed', error as Error);
      }

      if (cancelled) return;

      createLocalBackupSnapshot('startup').catch(() => null);

      storageGuard.enforce().catch(() => null);

      healthInterval = setInterval(() => {
        performPeriodicHealthCheck(db).catch(() => null);
      }, 15 * 60 * 1000);

      growthInterval = setInterval(() => {
        storageGuard.enforce().catch(() => null);
      }, 30 * 60 * 1000);

      pruneInterval = setInterval(() => {
        db.pruneData(90).catch(() => null);
      }, 24 * 60 * 60 * 1000);

      backupInterval = setInterval(() => {
        createLocalBackupSnapshot('periodic').catch(() => null);
      }, 6 * 60 * 60 * 1000);
    }

    bootstrap().catch(() => null);

    return () => {
      cancelled = true;
      if (healthInterval) clearInterval(healthInterval);
      if (growthInterval) clearInterval(growthInterval);
      if (pruneInterval) clearInterval(pruneInterval);
      if (backupInterval) clearInterval(backupInterval);
    };
  }, []);

  return null;
}

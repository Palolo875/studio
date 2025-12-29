'use client';

import { useEffect } from 'react';
import { db } from '@/lib/database';
import { createLocalBackupSnapshot, openDbWithCorruptionRecovery, performPeriodicHealthCheck } from '@/lib/dbCorruptionRecovery';
import { performStartupIntegrityCheck } from '@/lib/dataIntegrityValidator';

async function estimateStorageUsage(): Promise<{ usage?: number; quota?: number } | null> {
  if (typeof navigator === 'undefined') return null;
  const storage = (navigator as any).storage;
  if (!storage?.estimate) return null;
  try {
    const estimate = await storage.estimate();
    return { usage: estimate.usage, quota: estimate.quota };
  } catch {
    return null;
  }
}

export function DatabaseBootstrapper() {
  useEffect(() => {
    let cancelled = false;
    let healthInterval: ReturnType<typeof setInterval> | undefined;
    let growthInterval: ReturnType<typeof setInterval> | undefined;
    let backupInterval: ReturnType<typeof setInterval> | undefined;

    async function bootstrap() {
      try {
        await openDbWithCorruptionRecovery(db);
      } catch {
        return;
      }

      if (cancelled) return;

      try {
        await performStartupIntegrityCheck(db);
      } catch {
        // ignore
      }

      if (cancelled) return;

      createLocalBackupSnapshot('startup').catch(() => null);

      healthInterval = setInterval(() => {
        performPeriodicHealthCheck(db).catch(() => null);
      }, 15 * 60 * 1000);

      growthInterval = setInterval(() => {
        estimateStorageUsage().then(() => null);
      }, 30 * 60 * 1000);

      backupInterval = setInterval(() => {
        createLocalBackupSnapshot('periodic').catch(() => null);
      }, 6 * 60 * 60 * 1000);
    }

    bootstrap().catch(() => null);

    return () => {
      cancelled = true;
      if (healthInterval) clearInterval(healthInterval);
      if (growthInterval) clearInterval(growthInterval);
      if (backupInterval) clearInterval(backupInterval);
    };
  }, []);

  return null;
}

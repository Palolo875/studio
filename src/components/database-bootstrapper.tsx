'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/database';
import { getAdaptationSignalsByPeriod, getSetting, setSetting } from '@/lib/database';
import { createLocalBackupSnapshot, openDbWithCorruptionRecovery, performPeriodicHealthCheck } from '@/lib/dbCorruptionRecovery';
import { performStartupIntegrityCheck } from '@/lib/dataIntegrityValidator';
import { dbUsageMonitor } from '@/lib/dbUsageMonitor';
import { storageGuard } from '@/lib/storageGuard';
import { performanceTracker } from '@/lib/performanceTracker';
import { memoryMonitor } from '@/lib/memoryMonitor';
import { phase4Invariants } from '@/lib/phase4Invariants';
import { batteryAwareness } from '@/lib/batteryAwareness';
import { initializeDecisionQualityTracking } from '@/lib/decisionQualityMonitor';
import { adaptationManager } from '@/lib/phase6Implementation';
import { createLogger } from '@/lib/logger';

const PHASE6_LAST_WEEKLY_ADAPTATION_KEY = 'phase6_last_weekly_adaptation_ts';

const logger = createLogger('DatabaseBootstrapper');

export function DatabaseBootstrapper() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    let cancelled = false;
    let healthInterval: ReturnType<typeof setInterval> | undefined;
    let growthInterval: ReturnType<typeof setInterval> | undefined;
    let backupInterval: ReturnType<typeof setInterval> | undefined;
    let pruneInterval: ReturnType<typeof setInterval> | undefined;
    let phase4Interval: ReturnType<typeof setInterval> | undefined;
    let phase6WeeklyInterval: ReturnType<typeof setInterval> | undefined;

    async function bootstrap() {
      try {
        await openDbWithCorruptionRecovery(db);
      } catch (error) {
        logger.error('DB bootstrap failed', error as Error);
        return;
      }

      if (cancelled) return;

      // On s'assure que les tâches sont bien présentes
      try {
        const count = await db.tasks.count();
        if (count === 0) {
           logger.info('Database empty, checking for sync needed');
        }
      } catch (e) {
        logger.error('Error checking task count', e as Error);
      }

      try {
        await performStartupIntegrityCheck(db);
        // Préchauffage du moteur NLP
        import('@/lib/nlp/RealTaskClassifier').then(m => {
          if (m && typeof m === 'object') {
             logger.info('NLP module preloaded');
          }
        }).catch((e: Error) => logger.error('NLP import failed', e));
      } catch (error) {
        logger.warn('Startup integrity check failed', { error: (error as Error).message });
      }

      if (cancelled) return;

      createLocalBackupSnapshot('startup').catch(() => null);

      storageGuard.enforce().catch(() => null);

      storageGuard.startMonitoring();
      performanceTracker.startMonitoring();
      memoryMonitor.startMonitoring();
      batteryAwareness.initialize().catch(() => null);
      dbUsageMonitor.start();
      initializeDecisionQualityTracking();

      phase4Invariants.onViolation((inv) => {
        try {
          phase4Invariants.enforceInvariant(inv.id);
        } catch {
          // ignore
        }
      });

      phase4Interval = setInterval(() => {
        try {
          phase4Invariants.checkAll();
        } catch {
          // ignore
        }
      }, 60_000);

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

      const runPhase6WeeklyIfDue = async () => {
        const now = Date.now();
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        const lastRun = await getSetting<number>(PHASE6_LAST_WEEKLY_ADAPTATION_KEY);
        if (typeof lastRun === 'number' && now - lastRun < weekMs) return;

        const start = now - weekMs;
        const rows = await getAdaptationSignalsByPeriod(start, now);
        const signals = rows.map((r) => r.payload).filter(Boolean) as any[];
        await adaptationManager.processWeeklyAdaptation(signals as any);
        await setSetting(PHASE6_LAST_WEEKLY_ADAPTATION_KEY, now);
      };

      void runPhase6WeeklyIfDue().catch(() => null);

      phase6WeeklyInterval = setInterval(() => {
        void runPhase6WeeklyIfDue().catch(() => null);
      }, 6 * 60 * 60 * 1000);
    }

    bootstrap().catch(() => null);

    return () => {
      cancelled = true;
      if (healthInterval) clearInterval(healthInterval);
      if (growthInterval) clearInterval(growthInterval);
      if (pruneInterval) clearInterval(pruneInterval);
      if (backupInterval) clearInterval(backupInterval);
      if (phase4Interval) clearInterval(phase4Interval);
      if (phase6WeeklyInterval) clearInterval(phase6WeeklyInterval);

      storageGuard.stopMonitoring();
      performanceTracker.stopMonitoring();
      memoryMonitor.stopMonitoring();
      dbUsageMonitor.stop();
    };
  }, [isMounted]);

  if (!isMounted) return null;
  return null;
}

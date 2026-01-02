import { createLogger } from '@/lib/logger';

const logger = createLogger('DbUsageMonitor');

export interface DbUsageStats {
    usage: number;
    quota: number | null;
    percentage: number;
}

export interface DbUsageMonitorConfig {
    warnThreshold: number;
    criticalThreshold: number;
    checkInterval: number;
}

export const DEFAULT_DB_USAGE_MONITOR_CONFIG: DbUsageMonitorConfig = {
    warnThreshold: 0.6,
    criticalThreshold: 0.8,
    checkInterval: 30 * 60 * 1000,
};

export class DbUsageMonitor {
    private config: DbUsageMonitorConfig;
    private intervalId: ReturnType<typeof setInterval> | null = null;

    constructor(config?: Partial<DbUsageMonitorConfig>) {
        this.config = { ...DEFAULT_DB_USAGE_MONITOR_CONFIG, ...config };
    }

    async estimate(): Promise<DbUsageStats | null> {
        if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
            return null;
        }

        try {
            const estimate = await navigator.storage.estimate();
            const usage = estimate.usage ?? 0;
            const quota = estimate.quota ?? null;

            const percentage = quota && quota > 0 ? usage / quota : 0;

            return { usage, quota, percentage };
        } catch (error) {
            logger.error('Failed to estimate storage usage', error as Error);
            return null;
        }
    }

    async checkOnce(): Promise<void> {
        const stats = await this.estimate();
        if (!stats) return;

        if (stats.percentage >= this.config.criticalThreshold) {
            logger.warn('IndexedDB usage critical', {
                usage: stats.usage,
                quota: stats.quota,
                percentage: stats.percentage,
            });
            return;
        }

        if (stats.percentage >= this.config.warnThreshold) {
            logger.info('IndexedDB usage growing', {
                usage: stats.usage,
                quota: stats.quota,
                percentage: stats.percentage,
            });
        }
    }

    start(): void {
        if (this.intervalId) return;

        this.intervalId = setInterval(() => {
            this.checkOnce().catch(() => null);
        }, this.config.checkInterval);

        void this.checkOnce();
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

export const dbUsageMonitor = new DbUsageMonitor();

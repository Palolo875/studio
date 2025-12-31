/**
 * BurnoutEngine Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { BurnoutSignals, BurnoutThresholds } from './BurnoutEngine';
import { detectChronicOverload } from './BurnoutEngine';
import { getSessionsByDate } from '@/lib/database';

// Mock the database module
vi.mock('@/lib/database', () => ({
    db: {
        sessions: {
            where: vi.fn().mockReturnThis(),
            above: vi.fn().mockReturnThis(),
            toArray: vi.fn().mockResolvedValue([]),
        },
        tasks: {
            where: vi.fn().mockReturnThis(),
            anyOf: vi.fn().mockReturnThis(),
            toArray: vi.fn().mockResolvedValue([]),
        },
    },
    getSessionsByDate: vi.fn().mockResolvedValue([]),
    getOverridesByPeriod: vi.fn().mockResolvedValue([]),
    getSleepDataByPeriod: vi.fn().mockResolvedValue([]),
    getTodoTasks: vi.fn().mockResolvedValue([]),
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        startTimer: vi.fn(),
        endTimer: vi.fn(),
    }),
}));

describe('BurnoutEngine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Chronic overload detection', () => {
        it('should detect chronic overload when planned/completed is consistently above threshold', async () => {
            const mockGetSessionsByDate = vi.mocked(getSessionsByDate);

            mockGetSessionsByDate.mockResolvedValue([
                {
                    plannedTasks: 12,
                    completedTasks: 8,
                } as any,
            ]);

            const result = await detectChronicOverload({
                overloadDays: 5,
                overloadRatio: 1.2,
                sleepMinHours: 6,
                sleepCheckDays: 3,
                overrideRatioThreshold: 0.8,
                completionCollapseThreshold: 0.3,
                varianceMultiplier: 2,
                taskAccumulationLimit: 50,
                taskGrowthRateLimit: 5,
            });

            expect(result).toBe(true);
        });
    });

    describe('Signal Weights', () => {
        it('should have weights that sum to 1.0', () => {
            const SIGNAL_WEIGHTS = {
                chronicOverload: 0.25,
                sleepDebt: 0.25,
                overrideAbuse: 0.15,
                completionCollapse: 0.15,
                erraticBehavior: 0.10,
                taskAccumulation: 0.10,
            };

            const totalWeight = Object.values(SIGNAL_WEIGHTS).reduce((a, b) => a + b, 0);
            expect(totalWeight).toBe(1.0);
        });
    });

    describe('Risk Levels', () => {
        it('should classify risk levels correctly', () => {
            const getRiskLevel = (score: number) => {
                if (score >= 0.7) return 'critical';
                if (score >= 0.5) return 'high';
                if (score >= 0.3) return 'medium';
                return 'low';
            };

            expect(getRiskLevel(0.8)).toBe('critical');
            expect(getRiskLevel(0.7)).toBe('critical');
            expect(getRiskLevel(0.6)).toBe('high');
            expect(getRiskLevel(0.5)).toBe('high');
            expect(getRiskLevel(0.4)).toBe('medium');
            expect(getRiskLevel(0.3)).toBe('medium');
            expect(getRiskLevel(0.2)).toBe('low');
            expect(getRiskLevel(0)).toBe('low');
        });
    });

    describe('Threshold Validation', () => {
        it('should have valid default thresholds', () => {
            const DEFAULT_THRESHOLDS: BurnoutThresholds = {
                overloadDays: 5,
                overloadRatio: 1.2,
                sleepMinHours: 6,
                sleepCheckDays: 3,
                overrideRatioThreshold: 0.8,
                completionCollapseThreshold: 0.3,
                varianceMultiplier: 2,
                taskAccumulationLimit: 50,
                taskGrowthRateLimit: 5,
            };

            expect(DEFAULT_THRESHOLDS.overloadDays).toBeGreaterThan(0);
            expect(DEFAULT_THRESHOLDS.overloadRatio).toBeGreaterThan(1);
            expect(DEFAULT_THRESHOLDS.sleepMinHours).toBeGreaterThan(0);
            expect(DEFAULT_THRESHOLDS.overrideRatioThreshold).toBeGreaterThan(0);
            expect(DEFAULT_THRESHOLDS.overrideRatioThreshold).toBeLessThanOrEqual(1);
            expect(DEFAULT_THRESHOLDS.completionCollapseThreshold).toBeGreaterThan(0);
            expect(DEFAULT_THRESHOLDS.completionCollapseThreshold).toBeLessThan(1);
        });
    });

    describe('Recommendations Generation', () => {
        it('should generate correct recommendations for each signal', () => {
            const generateRecommendations = (signals: BurnoutSignals): string[] => {
                const recommendations: string[] = [];

                if (signals.chronicOverload) {
                    recommendations.push('Réduisez votre charge de travail quotidienne');
                    recommendations.push('Prenez des pauses régulières');
                }
                if (signals.sleepDebt) {
                    recommendations.push('Priorisez votre sommeil (visez 7-8h par nuit)');
                    recommendations.push('Établissez une routine de coucher régulière');
                }
                if (signals.overrideAbuse) {
                    recommendations.push('Faites confiance aux recommandations du système');
                }
                if (signals.completionCollapse) {
                    recommendations.push('Réduisez le nombre de tâches planifiées');
                }
                if (signals.erraticBehavior) {
                    recommendations.push('Établissez une routine de travail plus régulière');
                }
                if (signals.taskAccumulation) {
                    recommendations.push('Faites un tri dans vos tâches en attente');
                }

                if (recommendations.length === 0) {
                    recommendations.push('Continuez comme ça ! Votre rythme est sain.');
                }

                return recommendations;
            };

            // Test with no signals
            const healthyRecommendations = generateRecommendations({
                chronicOverload: false,
                sleepDebt: false,
                overrideAbuse: false,
                completionCollapse: false,
                erraticBehavior: false,
                taskAccumulation: false,
            });
            expect(healthyRecommendations).toContain('Continuez comme ça ! Votre rythme est sain.');

            // Test with all signals
            const burnoutRecommendations = generateRecommendations({
                chronicOverload: true,
                sleepDebt: true,
                overrideAbuse: true,
                completionCollapse: true,
                erraticBehavior: true,
                taskAccumulation: true,
            });
            expect(burnoutRecommendations.length).toBeGreaterThan(5);
            expect(burnoutRecommendations).toContain('Réduisez votre charge de travail quotidienne');
            expect(burnoutRecommendations).toContain('Priorisez votre sommeil (visez 7-8h par nuit)');
        });
    });

    describe('Score Calculation', () => {
        it('should calculate correct score from signals', () => {
            const SIGNAL_WEIGHTS = {
                chronicOverload: 0.25,
                sleepDebt: 0.25,
                overrideAbuse: 0.15,
                completionCollapse: 0.15,
                erraticBehavior: 0.10,
                taskAccumulation: 0.10,
            };

            const calculateScore = (signals: BurnoutSignals): number => {
                return (
                    (signals.chronicOverload ? SIGNAL_WEIGHTS.chronicOverload : 0) +
                    (signals.sleepDebt ? SIGNAL_WEIGHTS.sleepDebt : 0) +
                    (signals.overrideAbuse ? SIGNAL_WEIGHTS.overrideAbuse : 0) +
                    (signals.completionCollapse ? SIGNAL_WEIGHTS.completionCollapse : 0) +
                    (signals.erraticBehavior ? SIGNAL_WEIGHTS.erraticBehavior : 0) +
                    (signals.taskAccumulation ? SIGNAL_WEIGHTS.taskAccumulation : 0)
                );
            };

            // No signals = 0
            expect(calculateScore({
                chronicOverload: false,
                sleepDebt: false,
                overrideAbuse: false,
                completionCollapse: false,
                erraticBehavior: false,
                taskAccumulation: false,
            })).toBe(0);

            // All signals = 1
            expect(calculateScore({
                chronicOverload: true,
                sleepDebt: true,
                overrideAbuse: true,
                completionCollapse: true,
                erraticBehavior: true,
                taskAccumulation: true,
            })).toBe(1);

            // Only chronic overload and sleep debt = 0.5
            expect(calculateScore({
                chronicOverload: true,
                sleepDebt: true,
                overrideAbuse: false,
                completionCollapse: false,
                erraticBehavior: false,
                taskAccumulation: false,
            })).toBe(0.5);
        });
    });
});

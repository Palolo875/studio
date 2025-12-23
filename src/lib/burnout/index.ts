/**
 * Burnout module exports
 */
export {
    calculateBurnoutScore,
    scheduleDailyBurnoutCheck,
    detectChronicOverload,
    detectSleepDebt,
    detectOverrideAbuse,
    detectCompletionCollapse,
    detectErraticBehavior,
    detectTaskAccumulation,
    type BurnoutDetectionResult,
    type BurnoutSignals,
    type BurnoutThresholds,
} from './BurnoutEngine';

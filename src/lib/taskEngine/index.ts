// Point d'entrée principal du Cerveau de KairuFlow - Phase 1 & Phase 3

// Phase 1 - Composants existants
export * from './types';
export * from './energyModel';
export * from './capacityCalculator';
export { calculateImpactScore } from './scorer';
export * from './selector';
export * from './invariantChecker';
export * from './fallbackHandler';
export * from './edgeCaseHandler';
export { Session } from './sessionManager';
export * from './taskPoolManager';
export * from './taskAgeIndex';
export * from './timeConstraintManager';
export * from './energyStabilityDetector';
export * from './deadlineManager';
export * from './activeWindowManager';

// Phase 3 - Nouveaux composants
export * from './brainContracts';
export * from './decisionPolicyManager';
export { replayDecision } from './decisionLogger';
export * from './decisionExplanation';
export * from './userChallenge';
export * from './brainEngine';

// Phase 3.5 - Sécurité cognitive
export * from './cognitiveSecurity';
export * from './cognitiveProtection';
export * from './userControl';

// Phase 3.6 - Productivité tangible
export * from './taskOutcome';
export * from './productivityMetrics';

// Phase 3.7 - Apprentissage contrôlé
export * from './learnApplySeparation';
export * from './explicitFeedback';

// Phase 4 - Apprentissage passif
export { AppliedChange } from './passiveLearning';

// Phase 5 - Détection d'abus
export { CognitiveCost } from './abuseDetection';

// Phase 3.8 - Anti-abandon
export * from './abandonmentDetection';
export * from './zeroPunishmentReturn';
export * from './immediateReentry';

// Phase 3.9 - Sécurité comportementale
export * from './abuseDetection';
export * from './cognitiveCost';
export * from './delegationDetection';
export * from './softLimitation';
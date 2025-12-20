// Point d'entrée principal du Cerveau de KairuFlow - Phase 1 & Phase 3

// Phase 1 - Composants existants
export * from './types';
export * from './energyModel';
export * from './capacityCalculator';
export * from './scorer';
export * from './selector';
export * from './invariantChecker';
export * from './fallbackHandler';
export * from './edgeCaseHandler';
export * from './sessionManager';
export * from './taskPoolManager';
export * from './taskAgeIndex';
export * from './timeConstraintManager';
export * from './energyStabilityDetector';
export * from './deadlineManager';
export * from './activeWindowManager';

// Phase 3 - Nouveaux composants
export * from './brainContracts';
export * from './decisionPolicyManager';
export * from './decisionLogger';
export * from './decisionExplanation';
export * from './userChallenge';
export * from './brainEngine';
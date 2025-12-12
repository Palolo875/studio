/**
 * Point d'entrée pour la bibliothèque de playlist SOTA
 * Exporte tous les services et classes nécessaires
 */

// Services
export { ImpactAnalyzer } from './services/impactAnalyzer';
export type { ImpactMetrics } from './services/impactAnalyzer';

export { MomentumTracker } from './services/momentumTracker';
export type { MomentumData } from './services/momentumTracker';

export { KeystoneDetector } from './services/keystoneDetector';
export type { KeystoneHabit, WeeklyPattern } from './services/keystoneDetector';

export { FeedbackGenerator } from './services/feedbackGenerator';
export type { FeedbackMessage } from './services/feedbackGenerator';

export { RewardSystem } from './services/rewardSystem';
export type { Reward, UserProgress } from './services/rewardSystem';

// Générateur de playlist principal
export { PlaylistGeneratorSOTA } from './PlaylistGeneratorSOTA';
export type { PlaylistTask } from './PlaylistGeneratorSOTA';

// Version héritée
export { default as playlistGenerator } from '../playlistGenerator';
export { default as scoringRules } from '../scoringRules';
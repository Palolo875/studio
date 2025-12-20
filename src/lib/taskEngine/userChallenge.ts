// Système de contestation utilisateur - Phase 3.4
import { OverrideEvent } from './brainContracts';

/**
 * Type d'action de contestation
 */
export type ChallengeAction = "OVERRIDE" | "IGNORE" | "ASK_REVIEW";

/**
 * Contestation utilisateur
 */
export interface UserChallenge {
  id: string;
  decisionId: string;
  reason: string;
  userAction: ChallengeAction;
  acknowledgedRisks: boolean;
  timestamp: Date;
}

/**
 * Base de données simulée pour le stockage des contestations
 */
let challengeDatabase: UserChallenge[] = [];

/**
 * Enregistre une contestation utilisateur
 */
export function logUserChallenge(challenge: UserChallenge): void {
  challengeDatabase.push(challenge);
  console.log(`[UserChallenge] Contestation enregistrée: ${challenge.id}`);
}

/**
 * Récupère une contestation par son ID
 */
export function getUserChallenge(challengeId: string): UserChallenge | undefined {
  return challengeDatabase.find(c => c.id === challengeId);
}

/**
 * Récupère toutes les contestations pour une décision
 */
export function getChallengesForDecision(decisionId: string): UserChallenge[] {
  return challengeDatabase.filter(c => c.decisionId === decisionId);
}

/**
 * Génère un ID de contestation unique
 */
function generateChallengeId(): string {
  return `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Crée une contestation utilisateur
 */
export function createUserChallenge(
  decisionId: string,
  reason: string,
  userAction: ChallengeAction,
  acknowledgedRisks: boolean
): UserChallenge {
  const challenge: UserChallenge = {
    id: generateChallengeId(),
    decisionId,
    reason,
    userAction,
    acknowledgedRisks,
    timestamp: new Date()
  };
  
  logUserChallenge(challenge);
  return challenge;
}

/**
 * Applique une contestation (override) avec traçabilité
 */
export function applyUserOverride(
  invariantTouched: string,
  userReason: string,
  estimatedCognitiveDebt: number
): OverrideEvent {
  const overrideEvent: OverrideEvent = {
    invariantTouched,
    userReason,
    estimatedCognitiveDebt,
    acknowledged: true,
    timestamp: new Date()
  };
  
  console.log(`[UserOverride] Override appliqué: ${userReason}`);
  return overrideEvent;
}
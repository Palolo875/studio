// Système de contestation utilisateur - Phase 3.4
import { OverrideEvent } from './brainContracts';
import { createLogger } from '@/lib/logger';
import { getUserChallengesByDecisionId, recordUserChallenge } from '@/lib/database';

const logger = createLogger('UserChallenge');

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
  void recordUserChallenge({
    id: challenge.id,
    decisionId: challenge.decisionId,
    reason: challenge.reason,
    userAction: challenge.userAction,
    acknowledgedRisks: challenge.acknowledgedRisks,
    timestamp: challenge.timestamp.getTime(),
  });
  logger.info('Contestation enregistrée', { challengeId: challenge.id });
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

export async function getChallengesForDecisionAsync(decisionId: string): Promise<UserChallenge[]> {
  const rows = await getUserChallengesByDecisionId(decisionId);
  const mapped: UserChallenge[] = rows.map((r) => ({
    id: r.id,
    decisionId: r.decisionId,
    reason: r.reason,
    userAction: r.userAction,
    acknowledgedRisks: r.acknowledgedRisks,
    timestamp: new Date(r.timestamp),
  }));

  for (const c of mapped) {
    if (!challengeDatabase.some((x) => x.id === c.id)) challengeDatabase.push(c);
  }

  return mapped;
}

/**
 * Génère un ID de contestation unique
 */
function generateChallengeId(): string {
  return `challenge_${Date.now()}`;
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
    timestamp: new Date(),
    reversible: true
  };
  
  logger.info('Override appliqué', { userReason, invariantTouched, estimatedCognitiveDebt });
  return overrideEvent;
}
// Système de sécurité cognitive et anti-manipulation - Phase 3.5
import { OverrideEvent } from './brainContracts';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CognitiveSecurity');

/**
 * Invariants anti-manipulation
 */
export interface CognitiveInvariants {
  // Zéro culpabilisation
  NO_GUILT: boolean;
  // Pas de récompense variable
  NO_ADDICTION: boolean;
  // Pas d'urgence artificielle
  NO_URGENCY: boolean;
  // Transparence des nudges
  TRANSPARENT_NUDGES: boolean;
}

/**
 * Détection de dérive cognitive
 */
export interface CognitiveRiskSnapshot {
  timestamp: Date;
  addictionRiskScore: number; // 0.0 - 1.0
  coercionRiskScore: number;  // 0.0 - 1.0
  overloadRiskScore: number;   // 0.0 - 1.0
  autonomyLossScore: number;   // 0.0 - 1.0
}

/**
 * Mécanismes de protection active
 */
export type ProtectionAction =
  | "REDUCE_SUGGESTIONS"
  | "SILENCE"
  | "MODE_PASSIVE";

export interface CognitiveProtection {
  triggeredBy: keyof CognitiveInvariants;
  action: ProtectionAction;
  reversible: true;
}

/**
 * Contrôle utilisateur explicite
 */
export interface UserCognitiveSettings {
  nudgeLevel: 0 | 1 | 2 | 3; // 0 = aucun, 3 = maximum
  allowSuggestions: boolean;
  allowOptimization: boolean;
  showInfluenceReports: boolean;
}

/**
 * Paramètres cognitifs par défaut
 */
export const DEFAULT_COGNITIVE_SETTINGS: UserCognitiveSettings = {
  nudgeLevel: 2,
  allowSuggestions: true,
  allowOptimization: true,
  showInfluenceReports: false,
};


/**
 * Invariants anti-manipulation (Loi 4)
 */
export const COGNITIVE_INVARIANTS: CognitiveInvariants = {
  NO_GUILT: true,
  NO_ADDICTION: true,
  NO_URGENCY: true,
  TRANSPARENT_NUDGES: true
};

/**
 * Détecte la dérive cognitive basée sur l'historique et l'inactivité
 */
export function detectCognitiveRisk(
  overrideHistory: OverrideEvent[],
  lastActionAt: Date
): CognitiveRiskSnapshot {
  const now = new Date();
  const inactivityHours = (now.getTime() - lastActionAt.getTime()) / (1000 * 60 * 60);

  // Phase 3.5.3 : Silent Recovery Mode trigger (48h)
  const isSilentRecoveryNeeded = inactivityHours >= 48;

  // Compteur d'overrides récents (7 jours)
  const recentOverrides = overrideHistory.filter(event =>
    now.getTime() - event.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
  );

  // Calcul des scores SOTA
  const addictionRiskScore = Math.min(1.0, recentOverrides.length / 15);
  const overloadRiskScore = isSilentRecoveryNeeded ? 1.0 : Math.min(1.0, inactivityHours / 72);
  const autonomyLossScore = Math.min(1.0, recentOverrides.filter(o => o.estimatedCognitiveDebt > 2).length / 5);

  return {
    timestamp: now,
    addictionRiskScore,
    coercionRiskScore: 0,
    overloadRiskScore,
    autonomyLossScore
  };
}

/**
 * Applique une protection cognitive active (Phase 3.5.4)
 */
export function getRequiredProtection(riskSnapshot: CognitiveRiskSnapshot): CognitiveProtection | null {
  // PRIORITÉ 1 : Mode Silence Long (Phase 3.5.4)
  if (riskSnapshot.overloadRiskScore >= 1.0) {
    return {
      triggeredBy: "NO_URGENCY",
      action: "SILENCE",
      reversible: true
    };
  }

  // PRIORITÉ 2 : Autonomie
  if (riskSnapshot.autonomyLossScore > 0.8) {
    return {
      triggeredBy: "TRANSPARENT_NUDGES",
      action: "REDUCE_SUGGESTIONS",
      reversible: true
    };
  }

  // PRIORITÉ 3 : Addiction
  if (riskSnapshot.addictionRiskScore > 0.7) {
    return {
      triggeredBy: "NO_ADDICTION",
      action: "MODE_PASSIVE",
      reversible: true
    };
  }

  return null;
}

/**
 * Exécute l'action de protection cognitive
 */
export function applyProtection(action: ProtectionAction): void {
  logger.info('Action appliquée', { action });
  // Ici on notifierait le BrainEngine pour changer son SystemMode
}

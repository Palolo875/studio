// Système de sécurité cognitive et anti-manipulation - Phase 3.5
import { BrainDecision, OverrideEvent } from './brainContracts';

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
 * Vérifie les invariants anti-manipulation
 */
export function checkCognitiveInvariants(decision: BrainDecision): CognitiveInvariants {
  // Pour l'instant, tous les invariants sont respectés par défaut
  // Dans une implémentation complète, cela vérifierait réellement les décisions
  return {
    NO_GUILT: true,
    NO_ADDICTION: true,
    NO_URGENCY: true,
    TRANSPARENT_NUDGES: true
  };
}

/**
 * Détecte la dérive cognitive basée sur l'historique
 */
export function detectCognitiveDrift(overrideHistory: OverrideEvent[]): CognitiveRiskSnapshot {
  // Compteur d'overrides répétés
  const recentOverrides = overrideHistory.filter(event => 
    Date.now() - event.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000 // 7 derniers jours
  );
  
  // Calcul des scores de risque
  const addictionRiskScore = Math.min(1.0, recentOverrides.length / 10); // 10 overrides = risque maximum
  const coercionRiskScore = 0.0; // À implémenter avec plus de données
  const overloadRiskScore = 0.0; // À implémenter avec plus de données
  const autonomyLossScore = Math.min(1.0, recentOverrides.filter(o => 
    o.userReason.includes("forced") || o.userReason.includes("must")
  ).length / 5); // 5 forced overrides = perte d'autonomie
  
  return {
    timestamp: new Date(),
    addictionRiskScore,
    coercionRiskScore,
    overloadRiskScore,
    autonomyLossScore
  };
}

/**
 * Applique une protection cognitive si nécessaire
 */
export function applyCognitiveProtection(riskSnapshot: CognitiveRiskSnapshot): CognitiveProtection | null {
  // Si le risque d'addiction est élevé, réduire les suggestions
  if (riskSnapshot.addictionRiskScore > 0.7) {
    return {
      triggeredBy: "NO_ADDICTION",
      action: "REDUCE_SUGGESTIONS",
      reversible: true
    };
  }
  
  // Si la perte d'autonomie est élevée, passer en mode silencieux
  if (riskSnapshot.autonomyLossScore > 0.7) {
    return {
      triggeredBy: "TRANSPARENT_NUDGES",
      action: "SILENCE",
      reversible: true
    };
  }
  
  // Aucune protection nécessaire
  return null;
}

/**
 * Paramètres cognitifs par défaut
 */
export const DEFAULT_COGNITIVE_SETTINGS: UserCognitiveSettings = {
  nudgeLevel: 2, // Niveau moyen par défaut
  allowSuggestions: true,
  allowOptimization: true,
  showInfluenceReports: false // Désactivé par défaut pour éviter la surcharge
};
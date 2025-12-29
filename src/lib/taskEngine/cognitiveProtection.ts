// Mécanismes de protection cognitive active - Phase 3.5
import { CognitiveProtection, ProtectionAction, CognitiveRiskSnapshot } from './cognitiveSecurity';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CognitiveProtection');

/**
 * Applique une protection cognitive basée sur le niveau de risque
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
  
  // Si le risque de surcharge est élevé, passer en mode passif
  if (riskSnapshot.overloadRiskScore > 0.8) {
    return {
      triggeredBy: "NO_URGENCY",
      action: "MODE_PASSIVE",
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
 * Réduit le nombre de suggestions affichées
 */
export function reduceSuggestions(currentSuggestions: any[]): any[] {
  // Réduire de moitié le nombre de suggestions
  const reducedCount = Math.max(1, Math.floor(currentSuggestions.length / 2));
  return currentSuggestions.slice(0, reducedCount);
}

/**
 * Active le mode passif - moins d'interventions
 */
export function activatePassiveMode(): void {
  logger.info('Mode passif activé - réduction des interventions');
  // Dans une implémentation complète, cela désactiverait certains systèmes
}

/**
 * Active le mode silencieux - aucune suggestion
 */
export function activateSilenceMode(): void {
  logger.info('Mode silencieux activé - aucune suggestion');
  // Dans une implémentation complète, cela désactiverait toutes les notifications
}

/**
 * Applique l'action de protection appropriée
 */
export function executeProtectionAction(protection: CognitiveProtection): void {
  switch (protection.action) {
    case "REDUCE_SUGGESTIONS":
      logger.info('Réduction des suggestions déclenchée', { triggeredBy: protection.triggeredBy });
      // L'application réelle serait faite au niveau de l'interface utilisateur
      break;
      
    case "MODE_PASSIVE":
      activatePassiveMode();
      break;
      
    case "SILENCE":
      activateSilenceMode();
      break;
  }
}
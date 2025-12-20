// Système de détection d'abus - Phase 3.9
import { Task } from './types';
import { OverrideEvent } from './brainContracts';

/**
 * Types d'abus détectables
 */
export type AbuseType = 
  | "COMPULSIVE_OVERRIDE"     // Override compulsif
  | "CAPACITY_INFLATION"      // Inflation de capacité
  | "TOTAL_DELEGATION"        // Délégation totale
  | "MODE_EXPLOITATION";      // Exploitation des modes

/**
 * Signal d'abus
 */
export interface AbuseSignal {
  type: AbuseType;
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  detectedAt: Date;
  context: any; // Informations contextuelles supplémentaires
}

/**
 * Seuils de détection d'abus
 */
export interface AbuseDetectionThresholds {
  maxOverridesPerHour: number;
  maxOverridesPerDay: number;
  overrideFailureRateThreshold: number; // 0.0 - 1.0
  forcedTaskDropRateThreshold: number; // 0.0 - 1.0
}

/**
 * Typologie des abus
 */
export class AbuseTypology {
  private thresholds: AbuseDetectionThresholds;
  
  constructor(thresholds?: AbuseDetectionThresholds) {
    this.thresholds = thresholds || {
      maxOverridesPerHour: 5,
      maxOverridesPerDay: 20,
      overrideFailureRateThreshold: 0.3,
      forcedTaskDropRateThreshold: 0.6
    };
  }
  
  /**
   * Détecte l'override compulsif
   */
  detectCompulsiveOverride(overrides: OverrideEvent[], timeWindowHours: number = 1): AbuseSignal | null {
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindowHours * 60 * 60 * 1000);
    
    const recentOverrides = overrides.filter(override => 
      override.timestamp >= windowStart
    );
    
    if (recentOverrides.length > this.thresholds.maxOverridesPerHour) {
      return {
        type: "COMPULSIVE_OVERRIDE",
        severity: "HIGH",
        description: `Trop d'overrides (${recentOverrides.length}) dans la dernière heure`,
        detectedAt: now,
        context: {
          overrideCount: recentOverrides.length,
          threshold: this.thresholds.maxOverridesPerHour
        }
      };
    }
    
    return null;
  }
  
  /**
   * Détecte l'inflation de capacité
   */
  detectCapacityInflation(userReportedCapacity: number, systemEstimatedCapacity: number): AbuseSignal | null {
    // Si l'utilisateur déclare une capacité beaucoup plus élevée que l'estimation système
    if (userReportedCapacity > systemEstimatedCapacity * 2) {
      return {
        type: "CAPACITY_INFLATION",
        severity: "MEDIUM",
        description: "Capacité déclarée significativement supérieure à l'estimation système",
        detectedAt: new Date(),
        context: {
          userCapacity: userReportedCapacity,
          systemCapacity: systemEstimatedCapacity
        }
      };
    }
    
    return null;
  }
  
  /**
   * Détecte la délégation totale
   */
  detectTotalDelegation(userRequests: string[]): AbuseSignal | null {
    const delegationKeywords = ["decide for me", "tell me what to do", "choose for me"];
    
    const delegationRequests = userRequests.filter(request => 
      delegationKeywords.some(keyword => 
        request.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    if (delegationRequests.length > 3) { // Plus de 3 demandes de délégation
      return {
        type: "TOTAL_DELEGATION",
        severity: "MEDIUM",
        description: `Trop de demandes de délégation (${delegationRequests.length})`,
        detectedAt: new Date(),
        context: {
          delegationCount: delegationRequests.length,
          sampleRequests: delegationRequests.slice(0, 3)
        }
      };
    }
    
    return null;
  }
  
  /**
   * Détecte l'exploitation des modes
   */
  detectModeExploitation(modeHistory: string[]): AbuseSignal | null {
    // Compter les changements de mode fréquents
    const modeChanges: Record<string, number> = {};
    
    for (let i = 1; i < modeHistory.length; i++) {
      if (modeHistory[i] !== modeHistory[i-1]) {
        const transition = `${modeHistory[i-1]}->${modeHistory[i]}`;
        modeChanges[transition] = (modeChanges[transition] || 0) + 1;
      }
    }
    
    // Si un mode particulier est changé trop fréquemment
    const frequentTransitions = Object.entries(modeChanges).filter(([_, count]) => count > 5);
    
    if (frequentTransitions.length > 0) {
      return {
        type: "MODE_EXPLOITATION",
        severity: "LOW",
        description: `Changements de mode fréquents détectés`,
        detectedAt: new Date(),
        context: {
          frequentTransitions
        }
      };
    }
    
    return null;
  }
}

// Instance singleton pour la typologie des abus
export const abuseTypology = new AbuseTypology();

/**
 * Paramètres de throttling des overrides
 */
export interface OverrideThrottleParams {
  windowMinutes: number;
  maxOverrides: number;
  effect: "CONFIRMATION_REQUIRED" | "DELAY" | "WARNING";
}

/**
 * Gestionnaire de throttling des overrides
 */
export class OverrideThrottler {
  private throttleParams: OverrideThrottleParams;
  private overrideHistory: Date[] = [];
  
  constructor(params?: OverrideThrottleParams) {
    this.throttleParams = params || {
      windowMinutes: 60,
      maxOverrides: 3,
      effect: "CONFIRMATION_REQUIRED"
    };
  }
  
  /**
   * Vérifie si un override est autorisé
   */
  isOverrideAllowed(): { allowed: boolean; reason?: string } {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.throttleParams.windowMinutes * 60 * 1000);
    
    // Nettoyer l'historique ancien
    this.overrideHistory = this.overrideHistory.filter(timestamp => timestamp >= windowStart);
    
    // Vérifier si la limite est atteinte
    if (this.overrideHistory.length >= this.throttleParams.maxOverrides) {
      return {
        allowed: false,
        reason: `Limite d'overrides atteinte (${this.throttleParams.maxOverrides} dans les ${this.throttleParams.windowMinutes} dernières minutes)`
      };
    }
    
    // Enregistrer cette tentative
    this.overrideHistory.push(now);
    
    return { allowed: true };
  }
  
  /**
   * Applique l'effet de throttling
   */
  applyThrottlingEffect(): string {
    switch (this.throttleParams.effect) {
      case "CONFIRMATION_REQUIRED":
        return "Tu as déjà forcé plusieurs décisions récemment. Confirme consciemment.";
      case "DELAY":
        return "Attendez quelques minutes avant de forcer une autre décision.";
      case "WARNING":
        return "Attention : forcer trop de décisions peut nuire à votre productivité.";
      default:
        return "Confirmation requise pour continuer.";
    }
  }
}

// Instance singleton pour le throttling
export const overrideThrottler = new OverrideThrottler();
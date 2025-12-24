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
      if (modeHistory[i] !== modeHistory[i - 1]) {
        const transition = `${modeHistory[i - 1]}->${modeHistory[i]}`;
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

/**
 * Coût cognitif explicite (Phase 3.9.4)
 */
export interface CognitiveCost {
  action: "OVERRIDE" | "FORCE_MODE" | "EXTRA_TASK";
  estimatedCost: number; // ex: 25% de la capacité
  acknowledged: boolean;
}

/**
 * Détection de délégation excessive (Phase 3.9.5)
 */
export class DelegationGuard {
  private delegationSignals: string[] = ["decide_for_me", "tell_me_what_to_do", "choose for me"];
  private repeatCount: number = 0;

  /**
   * Analyse si l'action de l'utilisateur est une abdication de responsabilité
   */
  shouldReframe(userInput: string): boolean {
    const isDelegation = this.delegationSignals.some(s => userInput.toLowerCase().includes(s));
    if (isDelegation) this.repeatCount++;

    // Si l'utilisateur demande 3 fois de suite, on reframe (Phase 3.9.5)
    return this.repeatCount >= 3;
  }

  getReframingMessage(): string {
    return "Je peux t'aider à clarifier, mais le choix final t'appartient pour garantir ton autonomie.";
  }
}

/**
 * Gestionnaire d'abus SOTA
 */
export class BrainAbuseProtector {
  /**
   * Calcule le coût cognitif d'un override (Phase 3.9.4)
   */
  calculateOverrideCost(task: Task): CognitiveCost {
    // Les tâches imposées ont un droit de passage mais coûtent quand même (Phase 3.9.7)
    const baseCost = task.origin === "imposed" ? 15 : 25;

    return {
      action: "OVERRIDE",
      estimatedCost: baseCost,
      acknowledged: false
    };
  }

  /**
   * Applique une limitation douce (Phase 3.9.5) - Friction sans blocage
   */
  getFrictionLevel(overrideCount: number): "NONE" | "CONFIRMATION" | "THROTTLE" {
    if (overrideCount > 10) return "THROTTLE"; // Ralentissement volontaire
    if (overrideCount > 5) return "CONFIRMATION"; // Demande de conscience
    return "NONE";
  }
}
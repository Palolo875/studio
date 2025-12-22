// Phase 7 Implementation - Autorité, Souveraineté & Limites du Système

// Types pour l'autorité
export interface AuthorityContract {
  userAuthority: {
    canOverride: boolean;
    canDisableBrain: boolean;
    canResetAdaptation: boolean;
  };

  systemAuthority: {
    canRefuseTasks: boolean;
    canFreezeAdaptation: boolean;
    canEnterSafeMode: boolean;
  };

  sharedRules: {
    transparencyMandatory: true;
    reversibilityGuaranteed: true;
    userConsentRequired: boolean;
  };
}

// Contextes d'autorité
export interface AuthorityContext {
  // User a autorité ABSOLUE sur :
  user: {
    tasks: "FULL";              // Créer/modifier/supprimer
    data: "FULL";               // Export/delete
    modes: "SUGGEST_ONLY";      // Système suggère, user décide
    parameters: "FULL";         // Reset/adjust
    consent: "FULL";            // Opt-in/out features
  };
  
  // Système a autorité sur :
  system: {
    safetyLimits: "ENFORCE";    // Lignes rouges non-négociables
    dataIntegrity: "ENFORCE";   // Validation, cohérence
    performance: "ENFORCE";     // Budgets, fallbacks
    adaptation: "SUGGEST";      // Propose, user confirme
    warnings: "INFORM";         // Alerte, n'empêche pas
  };
  
  // Zones grises (négociation) :
  negotiated: {
    overrides: {
      allowed: true;
      cost: "EXPLICIT";         // Coût visible
      limit: "SOFT";            // Peut être dépassé avec confirmation
    },
    
    protectiveMode: {
      trigger: "AUTOMATIC";     // Si burnout signals
      exit: "USER_REQUEST";     // User peut sortir
      duration: "24h minimum";  // Pas de toggle rapide
    }
  };
}

// Lignes rouges non négociables
export const NON_NEGOTIABLES = {
  maxDailyLoad: 1.3,        // × charge soutenable
  minRecoveryTime: 8 * 60 * 60 * 1000,   // sommeil (8 heures en ms)
  burnoutSignalsLimit: 3,   // seuil cumulatif
  ethicalRefusal: true
};

// Interface pour les signaux de burnout
export interface BurnoutSignals {
  // Signal 1 : Surcharge chronique
  chronicOverload: {
    trigger: "dailyLoad > 1.2 for 5+ consecutive days";
    weight: 1.0;
    detected: boolean;
  };
  
  // Signal 2 : Dette de sommeil (si tracking disponible)
  sleepDebt: {
    trigger: "reported sleep < 6h for 3+ days";
    weight: 1.5;  // Plus grave
    detected: boolean;
  };
  
  // Signal 3 : Overrides constants
  overrideAbuse: {
    trigger: "overrides > 80% of decisions for 7+ days";
    weight: 0.8;
    detected: boolean;
  };
  
  // Signal 4 : Complétion collapse
  completionCollapse: {
    trigger: "completion rate < 30% for 7+ days";
    weight: 1.0;
    detected: boolean;
  };
  
  // Signal 5 : Patterns erratiques
  erraticBehavior: {
    trigger: "session starts/abandons spike variance > 2σ";
    weight: 0.7;
    detected: boolean;
  };
  
  // Signal 6 : Accumulation tâches
  taskAccumulation: {
    trigger: "active tasks > 50 AND growth rate > 5/day";
    weight: 0.8;
    detected: boolean;
  };
}

// Interface pour le coût d'override
export interface OverrideCost {
  type: "TIME" | "ENERGY" | "FOCUS";
  explanationRequired: boolean;
}

// Interface pour le calcul du coût d'override
export interface OverrideCostCalculation {
  // Coût de base
  baseCost: number;
  // = 0.2 (20% du budget restant)
  
  // Multiplicateurs
  multipliers: {
    taskEffort: number;      // HEAVY = ×2
    energyMismatch: number;  // LOW energy + HEAVY task = ×1.5
    burnoutSignals: number;  // Signaux actifs = ×1.2 par signal
    recentOverrides: number; // Overrides < 2h = ×1.3
  };
  
  // Coût total
  total: number;
  // = baseCost × Π(multipliers)
  
  // Conséquences
  consequences: {
    budgetReduction: number;     // Points retirés
    protectionDisabled: boolean; // 24h
    warningLevel: "LOW" | "MEDIUM" | "HIGH";
  };
}

// Modes de souveraineté
export enum SovereigntyMode {
  MANUAL,        // cerveau OFF
  ASSISTED,      // suggestions faibles
  GUIDED,        // cerveau actif
  PROTECTIVE     // cerveau prioritaire
}

// Règles de transition entre modes
export interface ModeTransitionRules {
  // User peut toujours :
  userCanAlways: {
    MANUAL: "enter anytime";      // User reprend contrôle
    ASSISTED: "enter anytime";    // User veut suggestions légères
    GUIDED: "enter anytime";      // User veut guidage
  };
  
  // Système peut proposer :
  systemCanSuggest: {
    "MANUAL→ASSISTED": {
      trigger: "No activity 7+ days";
      message: "Tu n'as pas utilisé le système. Veux-tu des suggestions légères ?";
    };
    
    "ASSISTED→GUIDED": {
      trigger: "High override rate OR low completion";
      message: "Tu sembles avoir du mal à suivre. Veux-tu plus de guidage ?";
    };
    
    "GUIDED→PROTECTIVE": {
      trigger: "Burnout signals >= 3";
      message: "Signaux de surcharge détectés. Mode protection activé.";
      userCanReject: false;  // ⚠️ Sécurité
    };
    
    "PROTECTIVE→GUIDED": {
      trigger: "Burnout signals < 2 for 48h";
      message: "Situation améliorée. Retour mode guidé ?";
      userMustConfirm: true;
    };
  };
  
  // Contraintes
  constraints: {
    minDurationProtective: "24h";  // Pas de toggle rapide
    cooldownProtective: "48h";     // Entre deux activations
    maxManualDuration: "30 days";   // Alerte si trop long en MANUAL
  };
}

// Interface pour les signaux d'auto-destruction
export interface SelfDestructionSignals {
  chronicOverload: boolean;
  sleepDebt: boolean;
  constantOverrides: boolean;
  zeroCompletion: boolean;
}

// Interface pour le désaccord système
export interface SystemDisagreement {
  decisionId: string;
  reason: string;
  confidence: number; // 0–1
}

// Métrique clé Phase 7
export function calculateAutonomyIntegrityScore(
  systemDecisions: number,
  userDecisions: number,
  totalDecisions: number
): number {
  return 1 - Math.abs(systemDecisions - userDecisions) / totalDecisions;
}
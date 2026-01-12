/**
 * SCOPE D'OPTIMISATION DU CERVEAU - CORRECTION DE LA PHASE 3
 * Définit explicitement ce que le cerveau optimise et ce qu'il ne doit pas optimiser
 * 
 * CORRECTION DE LA FAILLE 1 : Clarification du scope d'optimisation du cerveau
 */

// Définition des domaines d'optimisation autorisés et interdits
export interface OptimizationScope {
  // Domaines STRICTEMENT INTERDITS (le cerveau ne doit JAMAIS optimiser ces objectifs)
  forbidden: OptimizationDomain[];
  
  // Domaines AUTORISÉS (le cerveau peut optimiser ces aspects)
  allowed: OptimizationDomain[];
  
  // Description explicite de la philosophie d'optimisation
  description: string;
}

// Domaines d'optimisation possibles
export type OptimizationDomain = 
  // INTERDITS - Ne doivent jamais être des objectifs d'optimisation
  | "performance"           // Performance brute
  | "importance"           // Importance subjective
  | "valeur"               // Valeur perçue
  | "engagement"           // Engagement utilisateur
  | "productivity_score"   // Score de productivité
  | "completion_rate"      // Taux de complétion
  | "time_efficiency"      // Efficacité temporelle
  | "user_compliance"      // Conformité de l'utilisateur
  
  // AUTORISÉS - Le cerveau peut optimiser ces aspects
  | "feasibility"          // Faisabilité
  | "cognitive_load"       // Charge cognitive
  | "continuity"           // Continuité de l'action
  | "sustainability"       // Durabilité de l'action
  | "actionability"        // Capacité à agir
  | "cognitive_safety"     // Sécurité cognitive
  | "decision_feasibility" // Faisabilité des décisions
  | "task_completion"      // Complétion des tâches existantes
  | "cognitive_recovery"   // Récupération cognitive
  | "attention_stability"  // Stabilité de l'attention
  ;

// Configuration par défaut du scope d'optimisation
export const DEFAULT_OPTIMIZATION_SCOPE: OptimizationScope = {
  forbidden: [
    "performance",
    "importance", 
    "valeur",
    "engagement",
    "productivity_score",
    "completion_rate",
    "time_efficiency",
    "user_compliance"
  ],
  allowed: [
    "feasibility",
    "cognitive_load",
    "continuity", 
    "sustainability",
    "actionability",
    "cognitive_safety",
    "decision_feasibility",
    "task_completion",
    "cognitive_recovery",
    "attention_stability"
  ],
  description: "Le cerveau n'optimise pas un objectif utilisateur. Il optimise uniquement la faisabilité et la soutenabilité de l'action."
};

// Interface pour valider les décisions du cerveau par rapport au scope d'optimisation
export interface OptimizationValidator {
  validateOptimizationTarget(target: OptimizationDomain): {
    isValid: boolean;
    allowed: boolean;
    message: string;
  };
  
  validateOptimizationSequence(sequence: OptimizationDomain[]): {
    isValid: boolean;
    invalidTargets: OptimizationDomain[];
    message: string;
  };
}

// Validateur pour le scope d'optimisation
export class OptimizationScopeValidator implements OptimizationValidator {
  private scope: OptimizationScope;
  
  constructor(scope?: OptimizationScope) {
    this.scope = scope || DEFAULT_OPTIMIZATION_SCOPE;
  }
  
  validateOptimizationTarget(target: OptimizationDomain): {
    isValid: boolean;
    allowed: boolean;
    message: string;
  } {
    const isForbidden = this.scope.forbidden.includes(target);
    const isAllowed = this.scope.allowed.includes(target);
    
    if (isForbidden) {
      return {
        isValid: false,
        allowed: false,
        message: `Domaine d'optimisation interdit: ${target}. Le cerveau ne doit pas optimiser cet objectif.`
      };
    }
    
    if (isAllowed) {
      return {
        isValid: true,
        allowed: true,
        message: `Domaine d'optimisation autorisé: ${target}. Le cerveau peut optimiser cet aspect.`
      };
    }
    
    // Si ce n'est ni autorisé ni interdit, c'est ambigu
    return {
      isValid: false,
      allowed: false,
      message: `Domaine d'optimisation non spécifié: ${target}. Doit être explicitement autorisé ou interdit.`
    };
  }
  
  validateOptimizationSequence(sequence: OptimizationDomain[]): {
    isValid: boolean;
    invalidTargets: OptimizationDomain[];
    message: string;
  } {
    const invalidTargets: OptimizationDomain[] = [];
    
    for (const target of sequence) {
      const validation = this.validateOptimizationTarget(target);
      if (!validation.isValid) {
        invalidTargets.push(target);
      }
    }
    
    if (invalidTargets.length === 0) {
      return {
        isValid: true,
        invalidTargets: [],
        message: "Tous les domaines d'optimisation sont valides."
      };
    }
    
    return {
      isValid: false,
      invalidTargets,
      message: `Domaines d'optimisation invalides trouvés: ${invalidTargets.join(', ')}.`
    };
  }
  
  // Mettre à jour le scope
  updateScope(newScope: OptimizationScope): void {
    this.scope = newScope;
  }
  
  // Obtenir le scope actuel
  getScope(): OptimizationScope {
    return { ...this.scope };
  }
}

// Interface pour les décisions du cerveau qui doivent respecter le scope d'optimisation
export interface BrainDecisionWithOptimizationCheck {
  decisionType: string;
  optimizationTarget: OptimizationDomain;
  rationale: string;
  isAuthorized: boolean;
  validationMessage: string;
}

// Fonction utilitaire pour vérifier si une décision respecte le scope d'optimisation
export function validateBrainDecisionOptimization(
  optimizationTarget: OptimizationDomain,
  scope?: OptimizationScope
): BrainDecisionWithOptimizationCheck {
  const validator = new OptimizationScopeValidator(scope);
  const validationResult = validator.validateOptimizationTarget(optimizationTarget);
  
  return {
    decisionType: "optimization_target_check",
    optimizationTarget,
    rationale: `Vérification que le cerveau optimise "${optimizationTarget}" de manière appropriée`,
    isAuthorized: validationResult.isValid && validationResult.allowed,
    validationMessage: validationResult.message
  };
}

// Constantes pour les messages d'erreur et d'information
export const OPTIMIZATION_MESSAGES = {
  FORBIDDEN_TARGET: (target: string) => 
    `ATTENTION: Tentative d'optimisation interdite détectée pour "${target}". ` +
    `Le cerveau ne doit pas optimiser cet objectif. ` +
    `Se référer à la philosophie: "Le cerveau n'optimise pas un objectif utilisateur. ` +
    `Il optimise uniquement la faisabilité et la soutenabilité de l'action."`,
    
  ALLOWED_TARGET: (target: string) => 
    `VALIDE: Optimisation autorisée pour "${target}". ` +
    `Cet objectif est aligné avec la philosophie du cerveau.`,
    
  AMBIGUOUS_TARGET: (target: string) => 
    `ERREUR: Domaine d'optimisation "${target}" non spécifié dans le scope. ` +
    `Doit être explicitement autorisé ou interdit dans le contrat d'optimisation.`
};

// Exemple d'utilisation
/*
// Créer un validateur avec le scope par défaut
const optimizerValidator = new OptimizationScopeValidator();

// Vérifier une décision d'optimisation
const decisionCheck = validateBrainDecisionOptimization("performance");
console.log(decisionCheck.isAuthorized); // false
console.log(decisionCheck.validationMessage); // Message d'explication

// Vérifier une séquence de décisions
const sequence = ["feasibility", "performance", "cognitive_load"];
const sequenceValidation = optimizerValidator.validateOptimizationSequence(sequence);
console.log(sequenceValidation.invalidTargets); // ["performance"]
*/
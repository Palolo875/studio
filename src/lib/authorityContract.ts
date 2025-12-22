// Authority Contract - Contrat d'autorité entre le système et l'utilisateur
// Implémentation des étapes 1 et 2 de la phase 7

// Interface pour le contrat d'autorité
export interface AuthorityContract {
  userAuthority: {
    canOverride: boolean;  // Peut l'utilisateur forcer une tâche ?
    canDisableBrain: boolean; // Peut-il désactiver le système de suggestion ?
    canResetAdaptation: boolean; // Peut-il réinitialiser les adaptations ?
  };

  systemAuthority: {
    canRefuseTasks: boolean;  // Le système peut-il refuser des tâches ?
    canFreezeAdaptation: boolean; // Le système peut-il geler les adaptations ?
    canEnterSafeMode: boolean; // Le système peut-il forcer un mode sécurisé ?
  };

  sharedRules: {
    transparencyMandatory: true;  // Le système doit être transparent.
    reversibilityGuaranteed: true; // Les adaptations doivent être réversibles.
    userConsentRequired: boolean; // Consentement nécessaire pour toute modification importante.
  };
}

// Interface pour le contexte d'autorité
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

// Classe pour gérer le contrat d'autorité
export class AuthorityContractManager {
  private contract: AuthorityContract;
  
  constructor() {
    // Initialiser le contrat avec des valeurs par défaut
    this.contract = {
      userAuthority: {
        canOverride: true,
        canDisableBrain: true,
        canResetAdaptation: true
      },
      systemAuthority: {
        canRefuseTasks: true,
        canFreezeAdaptation: true,
        canEnterSafeMode: true
      },
      sharedRules: {
        transparencyMandatory: true,
        reversibilityGuaranteed: true,
        userConsentRequired: true
      }
    };
  }
  
  // Obtenir le contrat actuel
  getContract(): AuthorityContract {
    return { ...this.contract };
  }
  
  // Mettre à jour le contrat
  updateContract(newContract: Partial<AuthorityContract>): void {
    this.contract = {
      ...this.contract,
      ...newContract,
      userAuthority: {
        ...this.contract.userAuthority,
        ...newContract.userAuthority
      },
      systemAuthority: {
        ...this.contract.systemAuthority,
        ...newContract.systemAuthority
      },
      sharedRules: {
        ...this.contract.sharedRules,
        ...newContract.sharedRules
      }
    };
  }
  
  // Vérifier si l'utilisateur peut forcer une tâche
  canUserOverride(): boolean {
    return this.contract.userAuthority.canOverride;
  }
  
  // Vérifier si le système peut refuser des tâches
  canSystemRefuseTasks(): boolean {
    return this.contract.systemAuthority.canRefuseTasks;
  }
  
  // Vérifier si le consentement utilisateur est requis
  isUserConsentRequired(): boolean {
    return this.contract.sharedRules.userConsentRequired;
  }
}